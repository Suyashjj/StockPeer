import uuid
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import text
from db import engine

TOP_N = 10
K = 8
W_ITEM = 0.5
MIN_MEMBERS = 2          # stocks with fewer members are too thin to recommend
ALGO = "ml"


def norm(s):
    lo, hi = s.min(), s.max()
    return (s - lo) / (hi - lo) if hi > lo else np.zeros_like(s)


def main():
    joins = pd.read_sql(
        """
        SELECT m."userId" AS user_id, g."stockId" AS stock_id
        FROM "Membership" m JOIN "Group" g ON g.id = m."groupId"
        WHERE g.type = 'COMMUNITY'
        """,
        engine,
    )
    if joins.empty:
        return print("No joins yet, nothing to do")

    user_ids = joins.user_id.unique()
    stock_ids = joins.stock_id.unique()
    u_idx = {u: i for i, u in enumerate(user_ids)}
    s_idx = {s: i for i, s in enumerate(stock_ids)}

    X = csr_matrix(
        (np.ones(len(joins)), (joins.user_id.map(u_idx), joins.stock_id.map(s_idx))),
        shape=(len(user_ids), len(stock_ids)),
    )

    sim = cosine_similarity(X.T)
    np.fill_diagonal(sim, 0)

    k = min(K, min(X.shape) - 1)
    svd = TruncatedSVD(n_components=k, random_state=42)
    uv = svd.fit_transform(X)
    iv = svd.components_

    members = np.asarray(X.sum(axis=0)).ravel()
    too_thin = members < MIN_MEMBERS

    rows = []
    for u in range(len(user_ids)):
        joined = X[u].toarray().ravel()
        score = W_ITEM * norm(joined @ sim) + (1 - W_ITEM) * norm(uv[u] @ iv)
        score[joined > 0] = -np.inf
        score[too_thin] = -np.inf
        top = np.argsort(score)[::-1][:TOP_N]
        for j in top:
            if np.isfinite(score[j]) and score[j] > 0:
                rows.append((user_ids[u], stock_ids[j], float(score[j])))

    with engine.begin() as c:
        c.execute(text('DELETE FROM "Recommendation" WHERE algorithm = :a'), {"a": ALGO})
        for chunk_start in range(0, len(rows), 500):
            chunk = rows[chunk_start : chunk_start + 500]
            c.execute(
                text(
                    'INSERT INTO "Recommendation" (id, "userId", "stockId", score, reason, algorithm, "generatedAt") '
                    "VALUES (:id, :u, :s, :sc, :r, :a, now())"
                ),
                [
                    {
                        "id": "rec" + uuid.uuid4().hex[:20],
                        "u": u,
                        "s": s,
                        "sc": sc,
                        "r": "People like you joined this",
                        "a": ALGO,
                    }
                    for u, s, sc in chunk
                ],
            )
    print(f"Wrote {len(rows)} recommendations for {len(user_ids)} users")


if __name__ == "__main__":
    main()