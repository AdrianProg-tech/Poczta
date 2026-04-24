from __future__ import annotations

import argparse
import csv
import random
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "generated_api_csv"
DEFAULT_SEED = 20260424


@dataclass(frozen=True)
class PersonPools:
    first_names: list[str]
    last_names: list[str]
    cities: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate CSV files for seeding the poczta backend through REST API."
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR, help="Output directory for CSV files.")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for reproducible data.")
    parser.add_argument("--users", type=int, default=10, help="Number of users to generate.")
    parser.add_argument("--points", type=int, default=6, help="Number of points to generate.")
    parser.add_argument("--shipments", type=int, default=12, help="Number of shipments to generate.")
    return parser.parse_args()


def write_csv(output_dir: Path, filename: str, headers: list[str], rows: list[dict[str, object]]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / filename).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def build_pools() -> PersonPools:
    return PersonPools(
        first_names=[
            "Roman",
            "Anna",
            "Jan",
            "Maria",
            "Piotr",
            "Katarzyna",
            "Oleksii",
            "Iryna",
            "Marek",
            "Paulina",
            "Michal",
            "Natalia",
        ],
        last_names=[
            "Nowak",
            "Kowalski",
            "Wisniewski",
            "Wojcik",
            "Krawczyk",
            "Mazur",
            "Lewandowski",
            "Zielinski",
            "Shevchenko",
            "Koval",
        ],
        cities=[
            "Warsaw",
            "Krakow",
            "Wroclaw",
            "Poznan",
            "Gdansk",
            "Lodz",
            "Kielce"
        ],
    )


def random_phone(rng: random.Random) -> str:
    return "+48" + "".join(str(rng.randint(0, 9)) for _ in range(9))


def generate_users(rng: random.Random, pools: PersonPools, count: int) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for index in range(1, count + 1):
        first_name = rng.choice(pools.first_names)
        last_name = rng.choice(pools.last_names)
        rows.append(
            {
                "firstName": first_name,
                "lastName": last_name,
                "email": f"{first_name.lower()}.{last_name.lower()}.{index}@example.com",
                "phone": random_phone(rng),
            }
        )
    return rows


def generate_points(rng: random.Random, pools: PersonPools, count: int) -> list[dict[str, object]]:
    point_types = ["PARCEL_LOCKER", "PICKUP_POINT", "BRANCH"]
    rows: list[dict[str, object]] = []
    for index in range(1, count + 1):
        city = rng.choice(pools.cities)
        point_type = rng.choice(point_types)
        rows.append(
            {
                "name": f"{city} {point_type} {index:02d}",
                "type": point_type,
                "city": city,
                "address": f"Main Street {rng.randint(1, 99)}",
                "postalCode": f"{rng.randint(10, 99)}-{rng.randint(100, 999)}",
                "active": "true",
            }
        )
    return rows


def generate_shipments(rng: random.Random, count: int) -> list[dict[str, object]]:
    delivery_types = ["COURIER", "LOCKER", "PICKUP_POINT"]
    size_categories = ["S", "M", "L"]
    rows: list[dict[str, object]] = []
    for index in range(1, count + 1):
        rows.append(
            {
                "trackingNumber": f"INPOST{index:04d}",
                "status": "CREATED",
                "senderName": f"Sender {index}",
                "senderPhone": random_phone(rng),
                "recipientName": f"Recipient {index}",
                "recipientPhone": random_phone(rng),
                "deliveryType": rng.choice(delivery_types),
                "weight": str(Decimal(rng.randint(50, 500)) / Decimal("100")),
                "sizeCategory": rng.choice(size_categories),
            }
        )
    return rows


def generate_payments(shipments: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for shipment in shipments[: max(1, len(shipments) // 2)]:
        rows.append(
            {
                "trackingNumber": shipment["trackingNumber"],
                "amount": "29.99",
                "method": "OFFLINE",
                "confirmOffline": "true",
            }
        )
    return rows


def generate_status_updates(shipments: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for shipment in shipments[: max(1, len(shipments) // 3)]:
        tracking_number = shipment["trackingNumber"]
        rows.extend(
            [
                {"trackingNumber": tracking_number, "status": "PAID"},
                {"trackingNumber": tracking_number, "status": "READY_FOR_POSTING"},
                {"trackingNumber": tracking_number, "status": "POSTED"},
            ]
        )
    return rows


def generate_tracking_events(shipments: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for shipment in shipments[: max(1, len(shipments) // 3)]:
        tracking_number = shipment["trackingNumber"]
        rows.extend(
            [
                {
                    "trackingNumber": tracking_number,
                    "status": "IN_TRANSIT",
                    "locationName": "Warsaw Sorting Center",
                    "description": "Shipment scanned at sorting center",
                },
                {
                    "trackingNumber": tracking_number,
                    "status": "OUT_FOR_DELIVERY",
                    "locationName": "Courier Depot",
                    "description": "Shipment handed over to courier",
                },
                {
                    "trackingNumber": tracking_number,
                    "status": "DELIVERED",
                    "locationName": "Recipient Address",
                    "description": "Shipment delivered successfully",
                },
            ]
        )
    return rows


def generate_complaints(
    shipments: list[dict[str, object]],
    users: list[dict[str, object]],
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for shipment, user in zip(shipments[: max(1, len(shipments) // 4)], users):
        rows.append(
            {
                "trackingNumber": shipment["trackingNumber"],
                "userEmail": user["email"],
                "type": "DAMAGED",
                "description": "Test complaint created from generated CSV data",
            }
        )
    return rows


def write_summary(output_dir: Path, tables: dict[str, list[dict[str, object]]]) -> None:
    lines = ["Generated API CSV files:"]
    for filename, rows in sorted(tables.items()):
        lines.append(f"- {filename}: {len(rows)} rows")
    (output_dir / "_summary.txt").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    args = parse_args()
    rng = random.Random(args.seed)
    pools = build_pools()

    users = generate_users(rng, pools, args.users)
    points = generate_points(rng, pools, args.points)
    shipments = generate_shipments(rng, args.shipments)
    payments = generate_payments(shipments)
    status_updates = generate_status_updates(shipments)
    tracking_events = generate_tracking_events(shipments)
    complaints = generate_complaints(shipments, users)

    tables: dict[str, list[dict[str, object]]] = {
        "users.csv": users,
        "points.csv": points,
        "shipments.csv": shipments,
        "payments.csv": payments,
        "shipment_status_updates.csv": status_updates,
        "tracking_events.csv": tracking_events,
        "complaints.csv": complaints,
    }

    headers = {
        "users.csv": ["firstName", "lastName", "email", "phone"],
        "points.csv": ["name", "type", "city", "address", "postalCode", "active"],
        "shipments.csv": [
            "trackingNumber",
            "status",
            "senderName",
            "senderPhone",
            "recipientName",
            "recipientPhone",
            "deliveryType",
            "weight",
            "sizeCategory",
        ],
        "payments.csv": ["trackingNumber", "amount", "method", "confirmOffline"],
        "shipment_status_updates.csv": ["trackingNumber", "status"],
        "tracking_events.csv": ["trackingNumber", "status", "locationName", "description"],
        "complaints.csv": ["trackingNumber", "userEmail", "type", "description"],
    }

    for filename, rows in tables.items():
        write_csv(args.output, filename, headers[filename], rows)

    write_summary(args.output, tables)


if __name__ == "__main__":
    main()
