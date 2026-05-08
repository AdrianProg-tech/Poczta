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
        description="Load scenario CSV data into the poczta backend through contract endpoints."
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
    extra_headers: dict[str, str] | None = None,
) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if extra_headers:
        headers.update(extra_headers)

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


def to_bool(value: str) -> bool:
    return value.strip().lower() == "true"


def point_key(row: dict[str, Any]) -> str:
    return str(row["pointCode"]).strip().upper()


def load_existing_maps(base_url: str, timeout: int) -> tuple[dict[str, str], dict[str, dict[str, Any]]]:
    users = http_json("GET", f"{base_url}/api/users", timeout=timeout) or []
    points = http_json("GET", f"{base_url}/api/points", timeout=timeout) or []

    user_map = {user["email"]: user["id"] for user in users}
    point_map = {point_key(point): point for point in points}
    return user_map, point_map


def load_users(rows: list[dict[str, str]], base_url: str, timeout: int, user_map: dict[str, str]) -> int:
    created = 0
    for row in rows:
        email = row["email"]
        if email in user_map:
            continue
        payload = {
            "firstName": row["firstName"],
            "lastName": row["lastName"],
            "email": email,
            "phone": row["phone"],
        }
        response = http_json("POST", f"{base_url}/api/users", payload=payload, timeout=timeout)
        user_map[email] = response["id"]
        created += 1
    return created


def load_points(rows: list[dict[str, str]], base_url: str, timeout: int, point_map: dict[str, dict[str, Any]]) -> int:
    created = 0
    for row in rows:
        code = point_key(row)
        if code in point_map:
            continue
        payload = {
            "pointCode": row["pointCode"],
            "name": row["name"],
            "type": row["type"],
            "city": row["city"],
            "address": row["address"],
            "postalCode": row["postalCode"],
            "phone": row["phone"],
            "openingHours": row["openingHours"],
            "active": to_bool(row["active"]),
        }
        response = http_json("POST", f"{base_url}/api/points", payload=payload, timeout=timeout)
        point_map[code] = response
        created += 1
    return created


def create_shipments(rows: list[dict[str, str]], base_url: str, timeout: int) -> tuple[int, dict[str, dict[str, str]]]:
    created = 0
    shipment_refs: dict[str, dict[str, str]] = {}
    for row in rows:
        payload = {
            "sender": {
                "name": row["senderName"],
                "phone": row["senderPhone"],
                "address": row["senderAddress"],
            },
            "recipient": {
                "name": row["recipientName"],
                "phone": row["recipientPhone"],
                "address": row["recipientAddress"],
            },
            "delivery": {
                "deliveryType": row["deliveryType"],
                "targetPointCode": row["targetPointCode"] or None,
            },
            "parcel": {
                "weight": float(row["weight"]),
                "sizeCategory": row["sizeCategory"],
                "declaredValue": float(row["declaredValue"]),
                "fragile": to_bool(row["fragile"]),
            },
            "payment": {
                "method": row["paymentMethod"],
            },
        }
        response = http_json(
            "POST",
            f"{base_url}/api/client/shipments",
            payload=payload,
            timeout=timeout,
            extra_headers={"X-User-Email": row["creatorEmail"]},
        )
        shipment_refs[row["shipmentKey"]] = {
            "shipmentId": response["shipmentId"],
            "trackingNumber": response["trackingNumber"],
            "creatorEmail": row["creatorEmail"],
            "recipientCity": row["recipientCity"],
        }
        created += 1
    return created, shipment_refs


def get_latest_payment_for_shipment(base_url: str, timeout: int, shipment_id: str) -> dict[str, Any]:
    payments = http_json("GET", f"{base_url}/api/payments?shipmentId={shipment_id}", timeout=timeout) or []
    if not payments:
        raise RuntimeError(f"No payment found for shipmentId={shipment_id}")
    return max(payments, key=lambda item: item.get("createdAt") or "")


def apply_payment_actions(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    shipment_refs: dict[str, dict[str, str]],
) -> tuple[int, dict[str, str]]:
    applied = 0
    payment_ids_by_shipment_key: dict[str, str] = {}
    for row in rows:
        shipment_ref = shipment_refs[row["shipmentKey"]]
        payment = get_latest_payment_for_shipment(base_url, timeout, shipment_ref["shipmentId"])
        payment_id = payment["id"]
        payment_ids_by_shipment_key[row["shipmentKey"]] = payment_id

        action = row["action"].strip().upper()
        if action == "MARK_PAID":
            http_json("POST", f"{base_url}/api/admin/payments/{payment_id}/mark-paid", timeout=timeout)
            http_json(
                "POST",
                f"{base_url}/api/admin/shipments/{shipment_ref['shipmentId']}/prepare-for-dispatch",
                timeout=timeout,
            )
        elif action == "FAIL":
            http_json("POST", f"{base_url}/api/admin/payments/{payment_id}/fail", timeout=timeout)
        elif action == "CANCEL":
            http_json("POST", f"{base_url}/api/admin/payments/{payment_id}/cancel", timeout=timeout)
        elif action != "NONE":
            raise RuntimeError(f"Unsupported payment action: {row['action']}")
        applied += 1
    return applied, payment_ids_by_shipment_key


def build_user_personas(rows: list[dict[str, str]], user_map: dict[str, str]) -> dict[str, dict[str, str]]:
    return {
        row["email"]: {
            "id": user_map[row["email"]],
            "persona": row["persona"].strip().upper(),
            "serviceCity": row["serviceCity"].strip().upper(),
        }
        for row in rows
        if row["email"] in user_map
    }


def choose_courier(
    shipment_ref: dict[str, str],
    assignment_row: dict[str, str],
    user_personas: dict[str, dict[str, str]],
    courier_loads: dict[str, int],
) -> dict[str, str]:
    if assignment_row["assignmentMode"].strip().upper() == "MANUAL":
        courier_email = assignment_row["courierEmail"]
        courier = user_personas.get(courier_email)
        if courier is None:
            raise RuntimeError(f"Courier not found for email={courier_email}")
        return {"email": courier_email, "id": courier["id"]}

    candidates = [
        {"email": email, "id": persona["id"], "serviceCity": persona["serviceCity"]}
        for email, persona in user_personas.items()
        if persona["persona"] == "COURIER"
    ]
    if not candidates:
        raise RuntimeError("No couriers available for auto-assignment")

    same_city = [candidate for candidate in candidates if candidate["serviceCity"] == shipment_ref["recipientCity"]]
    pool = same_city if same_city else candidates
    pool.sort(key=lambda candidate: (courier_loads.get(candidate["email"], 0), candidate["email"]))
    return {"email": pool[0]["email"], "id": pool[0]["id"]}


def assign_couriers(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    shipment_refs: dict[str, dict[str, str]],
    user_personas: dict[str, dict[str, str]],
) -> tuple[int, dict[str, dict[str, str]]]:
    created = 0
    courier_loads: dict[str, int] = {}
    task_refs: dict[str, dict[str, str]] = {}
    for row in rows:
        shipment_ref = shipment_refs[row["shipmentKey"]]
        courier = choose_courier(shipment_ref, row, user_personas, courier_loads)
        response = http_json(
            "POST",
            f"{base_url}/api/admin/shipments/{shipment_ref['shipmentId']}/assign-courier",
            payload={"courierId": courier["id"], "taskDate": row["taskDate"]},
            timeout=timeout,
        )
        task_refs[row["shipmentKey"]] = {
            "taskId": response["createdTaskId"],
            "courierId": courier["id"],
            "courierEmail": courier["email"],
        }
        courier_loads[courier["email"]] = courier_loads.get(courier["email"], 0) + 1
        created += 1
    return created, task_refs


def run_courier_actions(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    task_refs: dict[str, dict[str, str]],
) -> int:
    applied = 0
    for row in rows:
        task_ref = task_refs[row["shipmentKey"]]
        headers = {"X-Courier-Id": task_ref["courierId"]}
        task_id = task_ref["taskId"]

        action = row["action"].strip().upper()
        if action == "ACCEPT_ONLY":
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/accept", timeout=timeout, extra_headers=headers)
        elif action == "START_ONLY":
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/accept", timeout=timeout, extra_headers=headers)
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/start", timeout=timeout, extra_headers=headers)
        elif action == "COMPLETE_SUCCESS":
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/accept", timeout=timeout, extra_headers=headers)
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/start", timeout=timeout, extra_headers=headers)
            payload = {
                "deliveredAt": row["deliveredAt"],
                "note": row["note"],
            }
            http_json(
                "POST",
                f"{base_url}/api/courier/tasks/{task_id}/complete-delivery",
                payload=payload,
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "FAIL_TO_PICKUP":
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/accept", timeout=timeout, extra_headers=headers)
            http_json("POST", f"{base_url}/api/courier/tasks/{task_id}/start", timeout=timeout, extra_headers=headers)
            payload = {
                "result": row["result"],
                "note": row["note"],
                "redirectToPickup": True,
                "redirectPointCode": row["redirectPointCode"] or None,
            }
            http_json(
                "POST",
                f"{base_url}/api/courier/tasks/{task_id}/record-attempt",
                payload=payload,
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "NONE":
            pass
        else:
            raise RuntimeError(f"Unsupported courier action: {row['action']}")
        applied += 1
    return applied


def run_point_actions(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    shipment_refs: dict[str, dict[str, str]],
    payment_ids_by_shipment_key: dict[str, str],
) -> int:
    applied = 0
    for row in rows:
        shipment_ref = shipment_refs[row["shipmentKey"]]
        headers = {"X-Point-Code": row["pointCode"]}
        tracking_number = shipment_ref["trackingNumber"]
        action = row["action"].strip().upper()
        if action == "ACCEPT":
            http_json(
                "POST",
                f"{base_url}/api/point/shipments/{tracking_number}/accept",
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "RELEASE":
            http_json(
                "POST",
                f"{base_url}/api/point/shipments/{tracking_number}/release",
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "POST":
            http_json(
                "POST",
                f"{base_url}/api/point/shipments/{tracking_number}/post",
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "CONFIRM_OFFLINE_PAYMENT":
            payment_id = payment_ids_by_shipment_key.get(row["shipmentKey"])
            if not payment_id:
                raise RuntimeError(f"No payment reference found for shipmentKey={row['shipmentKey']}")
            http_json(
                "POST",
                f"{base_url}/api/point/payments/{payment_id}/confirm-offline",
                timeout=timeout,
                extra_headers=headers,
            )
        elif action == "NONE":
            pass
        else:
            raise RuntimeError(f"Unsupported point action: {row['action']}")
        applied += 1
    return applied


def run_complaint_actions(
    rows: list[dict[str, str]],
    base_url: str,
    timeout: int,
    shipment_refs: dict[str, dict[str, str]],
) -> int:
    applied = 0
    for row in rows:
        shipment_ref = shipment_refs[row["shipmentKey"]]
        create_response = http_json(
            "POST",
            f"{base_url}/api/client/complaints",
            payload={
                "trackingNumber": shipment_ref["trackingNumber"],
                "type": row["type"],
                "description": row["description"],
            },
            timeout=timeout,
            extra_headers={"X-User-Email": row["userEmail"]},
        )
        complaint_id = create_response["complaintId"]

        action = row["adminAction"].strip().upper()
        resolution_payload = {"resolutionNote": row["resolutionNote"] or None}
        if action == "NONE":
            pass
        elif action == "START_REVIEW_ONLY":
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/start-review", timeout=timeout)
        elif action == "ACCEPT_ONLY":
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/start-review", timeout=timeout)
            http_json(
                "POST",
                f"{base_url}/api/admin/complaints/{complaint_id}/accept",
                payload=resolution_payload,
                timeout=timeout,
            )
        elif action == "ACCEPT_AND_CLOSE":
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/start-review", timeout=timeout)
            http_json(
                "POST",
                f"{base_url}/api/admin/complaints/{complaint_id}/accept",
                payload=resolution_payload,
                timeout=timeout,
            )
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/close", timeout=timeout)
        elif action == "REJECT_ONLY":
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/start-review", timeout=timeout)
            http_json(
                "POST",
                f"{base_url}/api/admin/complaints/{complaint_id}/reject",
                payload=resolution_payload,
                timeout=timeout,
            )
        elif action == "REJECT_AND_CLOSE":
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/start-review", timeout=timeout)
            http_json(
                "POST",
                f"{base_url}/api/admin/complaints/{complaint_id}/reject",
                payload=resolution_payload,
                timeout=timeout,
            )
            http_json("POST", f"{base_url}/api/admin/complaints/{complaint_id}/close", timeout=timeout)
        else:
            raise RuntimeError(f"Unsupported complaint admin action: {row['adminAction']}")
        applied += 1
    return applied


def main() -> None:
    args = parse_args()
    input_dir = args.input.resolve()
    base_url = args.base_url.rstrip("/")

    users_rows = read_csv_rows(input_dir / "users.csv")
    points_rows = read_csv_rows(input_dir / "points.csv")
    shipments_rows = read_csv_rows(input_dir / "shipments.csv")
    payment_rows = read_csv_rows(input_dir / "payment_actions.csv")
    courier_assignment_rows = read_csv_rows(input_dir / "courier_assignments.csv")
    courier_action_rows = read_csv_rows(input_dir / "courier_task_actions.csv")
    point_action_rows = read_csv_rows(input_dir / "point_actions.csv")
    complaint_rows = read_csv_rows(input_dir / "complaints.csv")

    user_map, point_map = load_existing_maps(base_url, args.timeout)

    summary: list[tuple[str, int]] = []
    summary.append(("users", load_users(users_rows, base_url, args.timeout, user_map)))
    summary.append(("points", load_points(points_rows, base_url, args.timeout, point_map)))

    user_personas = build_user_personas(users_rows, user_map)

    shipment_count, shipment_refs = create_shipments(shipments_rows, base_url, args.timeout)
    summary.append(("shipments", shipment_count))

    payment_action_count, _payment_ids = apply_payment_actions(payment_rows, base_url, args.timeout, shipment_refs)
    summary.append(("payment_actions", payment_action_count))

    assignment_count, task_refs = assign_couriers(
        courier_assignment_rows,
        base_url,
        args.timeout,
        shipment_refs,
        user_personas,
    )
    summary.append(("courier_assignments", assignment_count))

    summary.append(("courier_task_actions", run_courier_actions(courier_action_rows, base_url, args.timeout, task_refs)))
    summary.append(("point_actions", run_point_actions(
        point_action_rows,
        base_url,
        args.timeout,
        shipment_refs,
        _payment_ids,
    )))
    summary.append(("complaints", run_complaint_actions(complaint_rows, base_url, args.timeout, shipment_refs)))

    print("Scenario import summary:")
    for name, count in summary:
        print(f"- {name}: {count}")

    print("Created shipment references:")
    for shipment_key, shipment_ref in shipment_refs.items():
        print(f"- {shipment_key}: {shipment_ref['trackingNumber']} ({shipment_ref['shipmentId']})")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
