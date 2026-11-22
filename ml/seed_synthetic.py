import random
import uuid
import pandas as pd
from sqlalchemy import text
from db import engine

random.seed(42)
N_USERS = 150
JOINS_PER_USER = (12, 30)
STAY_IN_TASTE = 0.8  # chance a join comes from the user's favourite sectors


def cid():
    return "syn" + uuid.uuid4().hex[:20]


def main():
    stocks = pd.read_sql(
        'SELECT id, sector FROM "Stock" WHERE sector IS NOT NULL AND "isActive" = true', engine
    )
    if len(stocks) < 50:
        raise SystemExit("Run scripts/seedSectors.ts in the backend first")

    by_sector = {s: g["id"].tolist() for s, g in stocks.groupby("sector")}
    sectors = list(by_sector)
    all_ids = stocks["id"].tolist()

    with engine.begin() as c:
        # Start clean, so you can re-run this file
        c.execute(text('DELETE FROM "User" WHERE email LIKE \'%@synthetic.test\''))

        # One COMMUNITY group per stock
        for sid in all_ids:
            c.execute(
                text(
                    'INSERT INTO "Group" (id, "stockId", type, "memberCount", "createdAt") '
                    "VALUES (:id, :sid, 'COMMUNITY', 0, now()) "
                    'ON CONFLICT ("stockId", type) DO NOTHING'
                ),
                {"id": cid(), "sid": sid},
            )
        gmap = dict(c.execute(text('SELECT "stockId", id FROM "Group" WHERE type = \'COMMUNITY\'')).all())

        total = 0
        for i in range(N_USERS):
            uid = cid()
            taste = random.sample(sectors, k=random.choice([1, 2]))
            c.execute(
                text(
                    'INSERT INTO "User" (id, name, email, phone, "passwordHash", role, "updatedAt") '
                    "VALUES (:id, :n, :e, :p, 'x', 'USER', now())"
                ),
                {"id": uid, "n": f"Synthetic {i}", "e": f"user{i}@synthetic.test", "p": f"9{i:09d}"},
            )

            picked = set()
            for _ in range(random.randint(*JOINS_PER_USER)):
                pool = (
                    [s for t in taste for s in by_sector[t]]
                    if random.random() < STAY_IN_TASTE
                    else all_ids
                )
                picked.add(random.choice(pool))

            for sid in picked:
                gid = gmap.get(sid)
                if not gid:
                    continue
                c.execute(
                    text('INSERT INTO "Membership" (id, "userId", "groupId", "joinedAt", "lastReadAt") VALUES (:id, :u, :g, now(), now())'),
                    {"id": cid(), "u": uid, "g": gid},
                )
                c.execute(
                    text('INSERT INTO "InteractionEvent" (id, "userId", "stockId", type, "createdAt") VALUES (:id, :u, :s, \'JOIN\', now())'),
                    {"id": cid(), "u": uid, "s": sid},
                )
                total += 1

        c.execute(
            text(
                'UPDATE "Group" g SET "memberCount" = (SELECT count(*) FROM "Membership" m WHERE m."groupId" = g.id) '
                "WHERE g.type = 'COMMUNITY'"
            )
        )
    print(f"Created {N_USERS} users and {total} joins")


if __name__ == "__main__":
    main()