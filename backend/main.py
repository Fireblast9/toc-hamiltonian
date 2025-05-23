from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from HamToSAT.converter import HamSAT

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_root():
    return {"Hello, world!"}


@app.get("/solve/{path}")
async def read_item(path: str):
    print(path)
    return HamSAT(path)
