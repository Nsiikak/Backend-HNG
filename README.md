# Backend Wizards — Stage 0: Dynamic Profile Endpoint

## Overview

This project implements a **RESTful API endpoint** that returns my profile information along with a **dynamic cat fact** fetched from the [Cat Facts API](https://catfact.ninja/fact). It demonstrates:

- Consuming external APIs
- Formatting JSON responses
- Returning dynamic data with **current UTC timestamps**

---

## Tech Stack

- **Backend:** Python 3.10+ / FastAPI
- **HTTP server:** Uvicorn
- **HTTP requests:** Requests library
- **Environment management:** python-dotenv

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/<your-username>/Backend-HNG.git
cd Backend-HNG
```

2. **Create virtual environment & install dependencies**

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

3. **Create `.env` file** with your details:

```env
MY_EMAIL=nsikakebong@example.com
MY_NAME=Nsikak-Abasi Ebong
MY_STACK=Python/FastAPI
```

4. **Run the API locally**

```bash
uvicorn main:app --reload
```

---

## API Endpoints

| Endpoint       | Method | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `/me`          | GET    | Returns profile info + dynamic cat fact    |
| `/`            | GET    | Optional welcome message                   |
| `/favicon.ico` | GET    | Optional favicon (prevents 404 in browser) |

---

## Example `/me` Response (Dummy Data)

```json
{
  "status": "success",
  "user": {
    "email": "janedoe@example.com",
    "name": "Jane Doe",
    "stack": "Python/FastAPI"
  },
  "timestamp": "2025-10-17T14:30:45.123456+00:00",
  "fact": "Cats can rotate their ears 180 degrees."
}
```

**Notes for Testing:**

- **Email, Name, Stack** → Replace with your personal info in `.env`.
- **Timestamp** → Updates dynamically with every request.
- **Fact** → Changes with each request (random cat fact from [Cat Facts API](https://catfact.ninja/fact)).
- If the API is unreachable, the `fact` field will show:

```json
"fact": "Could not fetch cat fact at this time."
```

---

## JSON Formatting

- JSON responses are **pretty-printed** for readability in browsers.

---

## Deployment

- Can be deployed on platforms like **Railway, Heroku, AWS EC2**, etc.
- Make sure to include your `.env` variables on the server.

---

## Author

**Nsikak-Abasi Ebong**
GitHub: [https://github.com/Nsiikak](https://github.com/Nsiikak)
