from __future__ import annotations

import argparse
import csv
from pathlib import Path


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "generated_api_csv"

ADMIN_TEMPLATES = [
    {
        "persona": "DISPATCHER",
        "serviceCity": "",
        "firstName": "Damian",
        "lastName": "Dispatcher",
        "email": "ops.dispatch@example.com",
        "phone": "+48520100101",
    },
    {
        "persona": "ADMIN",
        "serviceCity": "",
        "firstName": "Anna",
        "lastName": "Reviewer",
        "email": "admin.review@example.com",
        "phone": "+48520100102",
    },
]

COURIER_TEMPLATES = [
    ("WARSAW", "Piotr", "Warszawski", "courier.warsaw.1@example.com", "+48510100101"),
    ("WARSAW", "Marta", "Mazur", "courier.warsaw.2@example.com", "+48510100102"),
    ("KRAKOW", "Pawel", "Krakowski", "courier.krakow.1@example.com", "+48510100103"),
    ("KRAKOW", "Karolina", "Wisla", "courier.krakow.2@example.com", "+48510100104"),
    ("GDANSK", "Natalia", "Baltycka", "courier.gdansk.1@example.com", "+48510100105"),
    ("WROCLAW", "Michal", "Odra", "courier.wroclaw.1@example.com", "+48510100106"),
    ("POZNAN", "Tomasz", "Wielkopolski", "courier.poznan.1@example.com", "+48510100107"),
    ("WARSAW", "Kamil", "Mokotow", "courier.warsaw.3@example.com", "+48510100108"),
]

CLIENT_TEMPLATES = [
    ("Alicja", "Nowak", "alicja.nowak.client@example.com", "+48500100101"),
    ("Jan", "Kowalski", "jan.kowalski.client@example.com", "+48500100102"),
    ("Olena", "Shevchenko", "olena.shevchenko.client@example.com", "+48500100103"),
    ("Marek", "Dabrowski", "marek.dabrowski.client@example.com", "+48500100104"),
    ("Julia", "Wozniak", "julia.wozniak.client@example.com", "+48500100105"),
    ("Andrii", "Melnyk", "andrii.melnyk.client@example.com", "+48500100106"),
    ("Karolina", "Piasecka", "karolina.piasecka.client@example.com", "+48500100107"),
    ("Tomasz", "Lewandowski", "tomasz.lewandowski.client@example.com", "+48500100108"),
    ("Monika", "Sikora", "monika.sikora.client@example.com", "+48500100109"),
    ("Roman", "Kaczmarek", "roman.kaczmarek.client@example.com", "+48500100110"),
    ("Yuliia", "Bondar", "yuliia.bondar.client@example.com", "+48500100111"),
    ("Klaudia", "Borek", "klaudia.borek.client@example.com", "+48500100112"),
]

POINT_TEMPLATES = [
    ("POP-WAW-01", "Warsaw Pickup Central", "PICKUP_POINT", "Warsaw", "Marszalkowska 10", "00-001", "+48221234561", "Mon-Fri 08:00-20:00"),
    ("PLK-WAW-01", "Warsaw Locker North", "PARCEL_LOCKER", "Warsaw", "Pulawska 22", "02-515", "+48221234562", "24/7"),
    ("POP-KRK-01", "Krakow Pickup Center", "PICKUP_POINT", "Krakow", "Dietla 44", "31-070", "+48121234563", "Mon-Sat 09:00-19:00"),
    ("PLK-KRK-01", "Krakow Locker Bronowice", "PARCEL_LOCKER", "Krakow", "Jasnogorska 3", "31-358", "+48121234564", "24/7"),
    ("POP-GDN-01", "Gdansk Pickup Port", "PICKUP_POINT", "Gdansk", "Dluga 5", "80-827", "+48581234565", "Mon-Fri 08:00-19:00"),
    ("PLK-GDN-01", "Gdansk Locker Morena", "PARCEL_LOCKER", "Gdansk", "Schuberta 70", "80-172", "+48581234566", "24/7"),
    ("POP-WRO-01", "Wroclaw Pickup Hub", "PICKUP_POINT", "Wroclaw", "Legnicka 40", "54-204", "+48711234567", "Mon-Sat 09:00-18:00"),
    ("POP-POZ-01", "Poznan Pickup Center", "PICKUP_POINT", "Poznan", "Piekary 11", "61-823", "+48611234568", "Mon-Fri 08:00-18:00"),
]

CITY_ADDRESSES = {
    "WARSAW": ["Warsaw, Prosta 7", "Warsaw, Grzybowska 9", "Warsaw, Zelazna 14"],
    "KRAKOW": ["Krakow, Karmelicka 18", "Krakow, Dietla 12", "Krakow, Wielicka 20"],
    "GDANSK": ["Gdansk, Kartuska 77", "Gdansk, Chmielna 8", "Gdansk, Hallera 15"],
    "WROCLAW": ["Wroclaw, Legnicka 40", "Wroclaw, Grabiszynska 55", "Wroclaw, Swidnicka 21"],
    "POZNAN": ["Poznan, Glogowska 16", "Poznan, Piekary 11", "Poznan, Hetmanska 9"],
}

SENDER_ADDRESSES = [
    "Warsaw, Zielna 12",
    "Lodz, Piotrkowska 33",
    "Poznan, Piekary 11",
    "Warsaw, Krucza 20",
    "Lodz, Narutowicza 14",
    "Gdynia, Swietojanska 45",
    "Katowice, Chorzowska 8",
    "Szczecin, Rayskiego 17",
]

RECIPIENT_POOL = [
    ("Marek Bilski", "+48555111111"),
    ("Magda Rutkowska", "+48555222222"),
    ("Piotr Romanowski", "+48555333333"),
    ("Julia Krawiec", "+48555444444"),
    ("Konrad Wrona", "+48555555555"),
    ("Ewa Sobczak", "+48555666666"),
    ("Lukasz Michalik", "+48555777777"),
    ("Natalia Jarosz", "+48555888888"),
]

SCENARIO_ROTATION = [
    "PAYMENT_PENDING",
    "PAYMENT_FAILED",
    "READY_FOR_DISPATCH",
    "ASSIGNED_WAITING_ACCEPT",
    "ACCEPTED_WAITING_ROUTE",
    "IN_PROGRESS_COURIER",
    "DELIVERED_COURIER",
    "REDIRECT_PENDING_POINT_ACCEPT",
    "REDIRECT_AWAITING_PICKUP",
    "REDIRECT_RELEASED",
    "COMPLAINT_IN_REVIEW",
    "COMPLAINT_ACCEPTED",
    "OFFLINE_PAYMENT_PENDING",
    "OFFLINE_PAYMENT_CONFIRMED",
    "OFFLINE_POINT_READY_TO_POST",
    "OFFLINE_POINT_POSTED",
    "MANUAL_ASSIGNMENT_DELIVERED",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate scenario-based CSV files for seeding the poczta backend through contract endpoints."
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR, help="Output directory for CSV files.")
    parser.add_argument("--users", type=int, default=18, help="Approximate number of users to generate.")
    parser.add_argument("--points", type=int, default=8, help="Number of points to generate.")
    parser.add_argument("--shipments", type=int, default=24, help="Number of shipment scenarios to generate.")
    return parser.parse_args()


def write_csv(output_dir: Path, filename: str, headers: list[str], rows: list[dict[str, object]]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / filename).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def cleanup_output_dir(output_dir: Path, expected_files: set[str]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for path in output_dir.iterdir():
        if path.is_file() and path.name not in expected_files:
            try:
                path.unlink()
            except OSError:
                pass


def build_point_staff_users(points: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for point in points:
        if point["type"] != "PICKUP_POINT":
            continue
        city = str(point["city"]).strip()
        point_code = str(point["pointCode"]).strip()
        city_slug = city.lower().replace(" ", ".")
        rows.append(
            {
                "persona": "POINT_WORKER",
                "serviceCity": city.upper(),
                "pointCode": point_code,
                "firstName": "Point",
                "lastName": city,
                "email": f"point.{city_slug}.{point_code.lower()}@example.com",
                "phone": "+48530100000",
            }
        )
    return rows


def build_users(target_count: int, points: list[dict[str, object]]) -> list[dict[str, object]]:
    effective_count = max(target_count, 14)
    users: list[dict[str, object]] = list(ADMIN_TEMPLATES)
    point_workers = build_point_staff_users(points)

    remaining = effective_count - len(users)
    courier_count = min(len(COURIER_TEMPLATES), max(5, remaining // 3))
    point_worker_count = min(len(point_workers), max(1, remaining // 4))
    client_count = min(len(CLIENT_TEMPLATES), max(0, effective_count - len(users) - courier_count - point_worker_count))

    for service_city, first_name, last_name, email, phone in COURIER_TEMPLATES[:courier_count]:
        users.append(
            {
                "persona": "COURIER",
                "serviceCity": service_city,
                "pointCode": "",
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": phone,
            }
        )

    users.extend(point_workers[:point_worker_count])

    for first_name, last_name, email, phone in CLIENT_TEMPLATES[:client_count]:
        users.append(
            {
                "persona": "CLIENT",
                "serviceCity": "",
                "pointCode": "",
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "phone": phone,
            }
        )

    return users


def build_points(target_count: int) -> list[dict[str, object]]:
    effective_count = max(4, min(target_count, len(POINT_TEMPLATES)))
    rows = []
    for point_code, name, point_type, city, address, postal_code, phone, opening_hours in POINT_TEMPLATES[:effective_count]:
        rows.append(
            {
                "pointCode": point_code,
                "name": name,
                "type": point_type,
                "city": city,
                "address": address,
                "postalCode": postal_code,
                "phone": phone,
                "openingHours": opening_hours,
                "active": "true",
            }
        )
    return rows


def build_pickup_points_by_city(points: list[dict[str, object]]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for point in points:
        city_code = point["city"].strip().upper()
        if point["type"] != "PICKUP_POINT":
            continue
        result.setdefault(city_code, []).append(point["pointCode"])
    return result


def build_courier_emails_by_city(users: list[dict[str, object]]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for user in users:
        if user["persona"] != "COURIER":
            continue
        city_code = str(user["serviceCity"]).strip().upper()
        result.setdefault(city_code, []).append(str(user["email"]))
    return result


def shipment_key_for(scenario_name: str, index: int) -> str:
    return f"{scenario_name.lower()}_{index + 1:03d}"


def build_dataset(
    users: list[dict[str, object]],
    points: list[dict[str, object]],
    shipment_count: int,
) -> dict[str, list[dict[str, object]]]:
    clients = [user for user in users if user["persona"] == "CLIENT"]
    pickup_points_by_city = build_pickup_points_by_city(points)
    courier_emails_by_city = build_courier_emails_by_city(users)
    available_cities = [city for city in pickup_points_by_city if city in courier_emails_by_city]
    if not available_cities:
        available_cities = ["WARSAW"]

    shipments: list[dict[str, object]] = []
    payment_actions: list[dict[str, object]] = []
    courier_assignments: list[dict[str, object]] = []
    courier_task_actions: list[dict[str, object]] = []
    point_actions: list[dict[str, object]] = []
    complaints: list[dict[str, object]] = []

    for index in range(max(8, shipment_count)):
        scenario_name = SCENARIO_ROTATION[index % len(SCENARIO_ROTATION)]
        client = clients[index % len(clients)]
        city_code = available_cities[index % len(available_cities)]
        pickup_code = pickup_points_by_city[city_code][0]
        sender_address = SENDER_ADDRESSES[index % len(SENDER_ADDRESSES)]
        recipient_name, recipient_phone = RECIPIENT_POOL[index % len(RECIPIENT_POOL)]
        recipient_address = CITY_ADDRESSES[city_code][index % len(CITY_ADDRESSES[city_code])]
        shipment_key = shipment_key_for(scenario_name, index)
        task_date = f"2026-05-{9 + (index % 12):02d}"

        delivery_type = "COURIER"
        target_point_code = ""
        payment_method = "ONLINE"
        payment_action = "NONE"
        manual_courier_email = ""

        if scenario_name.startswith("OFFLINE_POINT") or scenario_name == "OFFLINE_PAYMENT_PENDING" or scenario_name == "OFFLINE_PAYMENT_CONFIRMED":
            delivery_type = "PICKUP_POINT"
            target_point_code = pickup_code
            payment_method = "OFFLINE_AT_POINT"
        elif "REDIRECT" in scenario_name:
            target_point_code = pickup_code

        if scenario_name in {
            "READY_FOR_DISPATCH",
            "ASSIGNED_WAITING_ACCEPT",
            "ACCEPTED_WAITING_ROUTE",
            "IN_PROGRESS_COURIER",
            "DELIVERED_COURIER",
            "REDIRECT_PENDING_POINT_ACCEPT",
            "REDIRECT_AWAITING_PICKUP",
            "REDIRECT_RELEASED",
            "COMPLAINT_IN_REVIEW",
            "COMPLAINT_ACCEPTED",
            "MANUAL_ASSIGNMENT_DELIVERED",
        }:
            payment_action = "MARK_PAID"
        elif scenario_name == "PAYMENT_FAILED":
            payment_action = "FAIL"

        if scenario_name == "MANUAL_ASSIGNMENT_DELIVERED":
            manual_courier_email = courier_emails_by_city[city_code][0]

        shipments.append(
            {
                "shipmentKey": shipment_key,
                "scenario": scenario_name,
                "creatorEmail": client["email"],
                "senderName": f"{client['firstName']} {client['lastName']}",
                "senderPhone": client["phone"],
                "senderAddress": sender_address,
                "recipientName": recipient_name,
                "recipientPhone": recipient_phone,
                "recipientAddress": recipient_address,
                "recipientCity": city_code,
                "deliveryType": delivery_type,
                "targetPointCode": target_point_code,
                "weight": f"{0.7 + (index % 5) * 0.55:.2f}",
                "sizeCategory": ["S", "M", "L"][index % 3],
                "declaredValue": f"{49 + (index % 7) * 38.5:.2f}",
                "fragile": "true" if index % 4 == 0 else "false",
                "paymentMethod": payment_method,
                "paymentAmount": f"{19.9 + (index % 6) * 3.5:.2f}",
            }
        )
        payment_actions.append({"shipmentKey": shipment_key, "action": payment_action})

        if scenario_name in {
            "ASSIGNED_WAITING_ACCEPT",
            "ACCEPTED_WAITING_ROUTE",
            "IN_PROGRESS_COURIER",
            "DELIVERED_COURIER",
            "REDIRECT_PENDING_POINT_ACCEPT",
            "REDIRECT_AWAITING_PICKUP",
            "REDIRECT_RELEASED",
            "COMPLAINT_IN_REVIEW",
            "COMPLAINT_ACCEPTED",
            "MANUAL_ASSIGNMENT_DELIVERED",
        }:
            courier_assignments.append(
                {
                    "shipmentKey": shipment_key,
                    "assignmentMode": "MANUAL" if manual_courier_email else "AUTO",
                    "courierEmail": manual_courier_email,
                    "taskDate": task_date,
                }
            )

        if scenario_name == "ACCEPTED_WAITING_ROUTE":
            courier_task_actions.append(
                {
                    "shipmentKey": shipment_key,
                    "action": "ACCEPT_ONLY",
                    "redirectPointCode": "",
                    "result": "",
                    "note": "Courier accepted the task and will start later.",
                    "deliveredAt": "",
                }
            )
        elif scenario_name == "IN_PROGRESS_COURIER":
            courier_task_actions.append(
                {
                    "shipmentKey": shipment_key,
                    "action": "START_ONLY",
                    "redirectPointCode": "",
                    "result": "",
                    "note": "Courier has started the route and is still in progress.",
                    "deliveredAt": "",
                }
            )
        elif scenario_name in {"DELIVERED_COURIER", "COMPLAINT_IN_REVIEW", "COMPLAINT_ACCEPTED", "MANUAL_ASSIGNMENT_DELIVERED"}:
            courier_task_actions.append(
                {
                    "shipmentKey": shipment_key,
                    "action": "COMPLETE_SUCCESS",
                    "redirectPointCode": "",
                    "result": "",
                    "note": "Delivered successfully during seeded scenario.",
                    "deliveredAt": f"2026-05-{9 + (index % 12):02d}T1{index % 8}:30:00",
                }
            )
        elif scenario_name in {"REDIRECT_PENDING_POINT_ACCEPT", "REDIRECT_AWAITING_PICKUP", "REDIRECT_RELEASED"}:
            courier_task_actions.append(
                {
                    "shipmentKey": shipment_key,
                    "action": "FAIL_TO_PICKUP",
                    "redirectPointCode": pickup_code,
                    "result": "RECIPIENT_ABSENT",
                    "note": "Recipient unavailable during seeded attempt.",
                    "deliveredAt": "",
                }
            )

        if scenario_name == "REDIRECT_AWAITING_PICKUP":
            point_actions.append({"shipmentKey": shipment_key, "pointCode": pickup_code, "action": "ACCEPT"})
        elif scenario_name == "REDIRECT_RELEASED":
            point_actions.extend(
                [
                    {"shipmentKey": shipment_key, "pointCode": pickup_code, "action": "ACCEPT"},
                    {"shipmentKey": shipment_key, "pointCode": pickup_code, "action": "RELEASE"},
                ]
            )

        if scenario_name == "COMPLAINT_IN_REVIEW":
            complaints.append(
                {
                    "complaintKey": f"cmp_review_{index + 1:03d}",
                    "shipmentKey": shipment_key,
                    "userEmail": client["email"],
                    "type": "DELAYED",
                    "description": "Shipment was delivered, but client requests an active review.",
                    "adminAction": "START_REVIEW_ONLY",
                    "resolutionNote": "Case is under review.",
                }
            )
        elif scenario_name == "COMPLAINT_ACCEPTED":
            complaints.append(
                {
                    "complaintKey": f"cmp_accept_{index + 1:03d}",
                    "shipmentKey": shipment_key,
                    "userEmail": client["email"],
                    "type": "DAMAGED",
                    "description": "Client reported damage after successful delivery.",
                    "adminAction": "ACCEPT_AND_CLOSE",
                    "resolutionNote": "Damage confirmed. Compensation approved.",
                }
            )

    return {
        "users.csv": users,
        "points.csv": points,
        "shipments.csv": shipments,
        "payment_actions.csv": payment_actions,
        "courier_assignments.csv": courier_assignments,
        "courier_task_actions.csv": courier_task_actions,
        "point_actions.csv": point_actions,
        "complaints.csv": complaints,
    }


def write_summary(output_dir: Path, tables: dict[str, list[dict[str, object]]]) -> None:
    lines = [
        "Generated scenario seed CSV files:",
        "- dataset goal: realistic contract-driven operational flows on a clean database",
    ]
    for filename, rows in sorted(tables.items()):
        lines.append(f"- {filename}: {len(rows)} rows")
    lines.extend(
        [
            "",
            "Included operational stories:",
            "- online payment pending and failed shipments",
            "- paid shipments waiting for dispatch or courier assignment",
            "- courier tasks in assigned, accepted, in-progress, delivered and failed states",
            "- redirected shipments waiting for point acceptance or client pickup",
            "- offline point payment cases left pending for manual testing",
            "- complaints left in review and complaints accepted and closed",
        ]
    )
    (output_dir / "_summary.txt").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    args = parse_args()
    points = build_points(args.points)
    users = build_users(args.users, points)
    tables = build_dataset(users, points, args.shipments)

    headers = {
        "users.csv": ["persona", "serviceCity", "pointCode", "firstName", "lastName", "email", "phone"],
        "points.csv": ["pointCode", "name", "type", "city", "address", "postalCode", "phone", "openingHours", "active"],
        "shipments.csv": [
            "shipmentKey",
            "scenario",
            "creatorEmail",
            "senderName",
            "senderPhone",
            "senderAddress",
            "recipientName",
            "recipientPhone",
            "recipientAddress",
            "recipientCity",
            "deliveryType",
            "targetPointCode",
            "weight",
            "sizeCategory",
            "declaredValue",
            "fragile",
            "paymentMethod",
            "paymentAmount",
        ],
        "payment_actions.csv": ["shipmentKey", "action"],
        "courier_assignments.csv": ["shipmentKey", "assignmentMode", "courierEmail", "taskDate"],
        "courier_task_actions.csv": ["shipmentKey", "action", "redirectPointCode", "result", "note", "deliveredAt"],
        "point_actions.csv": ["shipmentKey", "pointCode", "action"],
        "complaints.csv": ["complaintKey", "shipmentKey", "userEmail", "type", "description", "adminAction", "resolutionNote"],
    }

    expected_files = set(tables.keys()) | {"_summary.txt"}
    cleanup_output_dir(args.output, expected_files)

    for filename, rows in tables.items():
        write_csv(args.output, filename, headers[filename], rows)

    write_summary(args.output, tables)


if __name__ == "__main__":
    main()
