# API Seeding

## Goal

These scripts generate test CSV files and load them into the backend through REST API.

This is useful for:
- filling Oracle with test data
- smoke-testing the backend through real endpoints
- preparing demo data before classes

## Files

- `scripts/generate_api_csvs.py`
- `scripts/load_api_csvs.py`

## What Gets Generated

The generator creates:
- `users.csv`
- `points.csv`
- `shipments.csv`
- `payments.csv`
- `shipment_status_updates.csv`
- `tracking_events.csv`
- `complaints.csv`

All files are written by default to:
- `scripts/generated_api_csv`

## How To Generate CSV

From repo root:

```powershell
python .\scripts\generate_api_csvs.py
```

Example with custom counts:

```powershell
python .\scripts\generate_api_csvs.py --users 15 --points 8 --shipments 20
```

## How To Load Data Through API

Make sure:
- Oracle Docker is running
- backend is running on `http://localhost:8081`

Then run:

```powershell
python .\scripts\load_api_csvs.py
```

Custom base URL:

```powershell
python .\scripts\load_api_csvs.py --base-url http://localhost:8081
```

## Loading Order

The loader sends data in this order:

1. users
2. points
3. shipments
4. payments
5. shipment status updates
6. tracking events
7. complaints

This order matches the dependencies between entities.

## Notes

- The loader reuses existing users by `email`
- The loader reuses existing shipments by `trackingNumber`
- The loader reuses existing points by a composite key
- Payments, tracking events and complaints are treated as new actions and are sent each time

## Practical Demo Flow

1. Generate CSV
2. Start backend
3. Load CSV through API
4. Show data in:
   - Postman
   - Swagger
   - DBeaver
