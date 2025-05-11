from datetime import date
from os import getenv

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return "Hello World"
