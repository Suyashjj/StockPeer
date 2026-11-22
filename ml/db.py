import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

url = os.environ["DATABASE_URL"]
# Tell SQLAlchemy to use the psycopg2 driver we installed
if url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
elif url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg2://", 1)

engine = create_engine(url, pool_pre_ping=True)