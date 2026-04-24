from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any
from urllib import error, request


DEFAULT_INPUT_DIR = Path(__file__).resolve().parent / "generated_api_csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load generated CSV data into the poczta backend through REST API."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_DIR, help="Directory with CSV files.")
    parser.add_argument("--base-url", default="http://localhost:8081", help="Backend base URL.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds.")
    return parser.parse_args()


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def http_json(
    method: str,
    url: str,
    payload: dict[str, Any] | None = None,
    timeout: int = 20,
) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"

    http_request = request.Request(url, data=body, headers=headers, method=method)
    try:
        with request.urlopen(http_request, timeout=timeout) as response:
            if response.status == 204:
                return None
            response_body = response.read().decode("utf-8")
            return json.loads(response_body) if response_body else None
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with {exc.code}: {details}") from exc


def point_key(row: dict[str, Any]) -> tuple[Any, ...]:
    return (
        row.get("name"),
        row.get("type"),
        row.get("city"),
        row.get("address"),
        row.get("postalCode"),
        row.get("active"),
    )


def load_existing_maps(base_url: str, timeout: int) -> tuple[dict[str, str], dict[str, str], dict[tuple[Any, ...], str]]:
    users = http_json("GET", f"{base_url}/api/users", timeout=timeout) or []
    parcels = http_json("GET", f"{base_url}/api/parcels", timeout=timeout) or []
    points = http_json("GET", f"{base_url}/api/points", timeout=timeout) or []

    user_map = {user["email"]: user["id"] for user in users}
    shipment_map = {parcel["trackingNumber"]: parcel["id"] for parcel in parcels}
    point_map = {point_key(point): point["id"] for point in points}
    return user_map, shipment_map, point_map


def load_users(rows: list[dict[str, str]], base_url: str, timeout: int, user_map: dict[str, str]) -> int:
    created = 0
    for row in rows:
        email = row["email"]
        if email in user_map:
            continue
        response = http_json("POST", f"{base_url}/api/users", payload=row, timeout=timeout)
        user_map[email] = response["id"]
        created += 1
    return created


def load_points(rows: list[dict[str, str]], base_url: str, timeout: int, point_map: dict[tuple[Any, ...], str]) -> int:
    created = 0
    for row in rows:
        payload = {
            "name": row["name"],
            "type": row["type"],
            "city": row["city"],
            "address": row["address"],
            "postalCode": row["postalCode"],
            "active": row["active"].lower() == "true",
        }
        key = point_key(payload)
        if key in point_map:
            continue
        response = http_json("POST", f"{base_url}/api/points", payload=payload, timeout=timeout)
        point_map[key] = response["id"]
        created += 1
    return created


def load_shipments(rows: list[dict[str, str]], base_url: str, timeout: int, shipment_map: dict[str, str]) -> int:
    created = 0
    for row in rows:
        tracking_number = row["trackingNumber"]
        if tracking_number in shipment_map:
            continue
        payload = dict(row)
        payload["weight"] = float(row["weight"])
        response = http_json("POST", f"{base_url}/api/parcels", payload=payload, timeout=timeout)
        shipment_map[tracking_number] = response["id"]
        created += 1
    return created


def load_payments(rows: list[dict[str, str]], base_url: str, timeout: int, shipment_map: dict[str, str]) -> int:
    created = 0
    for row in rows:
        shipment_id = shipment_map.get(row["trackingNumber"])
        if shipment_id is None:
            raise RuntimeError(f"Shipment not found for trackingNumber={row['trackingNumber']}")

        payload = {
            "shipmentId": shipment_id,
            "amount": float(row["amount"]),
            "method": row["method"],
        }
        response = http_json("POST", f"{base_url}/api/payments", payload=payload, timeout=timeout)
        created += 1

        if row.get("confirmOffline", "").lower() == "true":
            http_json("PATCH", f"{base_url}/api/payments/{response['id']}/confirm-offline", timeout=timeout)

    return created


def load_status_updates(rows: list[dict[str, str]], base_url: str, timeout: int, shipment_map: dict[str, str]) -> int:
    applied = 0
    for row in rows:
        shipment_id = shipment_map.get(row["trackingNumber"])
        if shipment_id is None:
            raise RuntimeError(f"Shipment not found for trackingNumber={row['trackingNumber']}")
        http_json(
            "PATCH",
            f"{base_url}/api/parcels/{shipment_id}/status",
            payload={"status": row["status"]},
            timeout=timeout,
        )
        applied += 1
    return applied


def load_tracking(rows: list[dict[str, str]], base_url: str, timeout: int, shipment_map: dict[str, str]) -> int:
    created = 0
    for row in rows:
        shipment_id = shipment_map.get(row["trackingNumber"])
        if shipment_id is None:
            raise RuntimeError(f"Shipment not found for trackingNumber={row['trackingNumber']}")
        payload = {
            "shipmentId": shipment_id,
            "status": row["status"],
            "locationName": row["locationName"],
            "description": row["description"],
        }
        http_json("POST", f"{base_url}/api/tracking", payload=payload, timeout=timeout)
        created += 1
    return created


def load_complaints(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    shipment_map: dict[str, str],
    user_map: dict[str, str],
) -> int:
    created = 0
    for row in rows:
        shipment_id = shipment_map.get(row["trackingNumber"])
        user_id = user_map.get(row["userEmail"])
        if shipment_id is None:
            raise RuntimeError(f"Shipment not found for trackingNumber={row['trackingNumber']}")
        if user_id is None:
            raise RuntimeError(f"User not found for email={row['userEmail']}")

        payload = {
            "shipmentId": shipment_id,
            "userId": user_id,
            "type": row["type"],
            "description": row["description"],
        }
        http_json("POST", f"{base_url}/api/complaints", payload=payload, timeout=timeout)
        created += 1
    return created


def main() -> None:
    args = parse_args()
    input_dir = args.input.resolve()
    base_url = args.base_url.rstrip("/")

    user_map, shipment_map, point_map = load_existing_maps(base_url, args.timeout)

    summary: list[tuple[str, int]] = []
    summary.append(("users", load_users(read_csv_rows(input_dir / "users.csv"), base_url, args.timeout, user_map)))
    summary.append(("points", load_points(read_csv_rows(input_dir / "points.csv"), base_url, args.timeout, point_map)))
    summary.append(("shipments", load_shipments(read_csv_rows(input_dir / "shipments.csv"), base_url, args.timeout, shipment_map)))
    summary.append(("payments", load_payments(read_csv_rows(input_dir / "payments.csv"), base_url, args.timeout, shipment_map)))
    summary.append(("status_updates", load_status_updates(read_csv_rows(input_dir / "shipment_status_updates.csv"), base_url, args.timeout, shipment_map)))
    summary.append(("tracking_events", load_tracking(read_csv_rows(input_dir / "tracking_events.csv"), base_url, args.timeout, shipment_map)))
    summary.append(("complaints", load_complaints(read_csv_rows(input_dir / "complaints.csv"), base_url, args.timeout, shipment_map, user_map)))

    print("Import summary:")
    for name, count in summary:
        print(f"- {name}: {count}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
