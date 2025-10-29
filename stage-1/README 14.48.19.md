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

# String Analyzer API

Backend Wizards Stage 1 Task - A RESTful API service that analyzes strings and stores their computed properties.

## Features

- ✅ String length calculation
- ✅ Palindrome detection (case-insensitive)
- ✅ Unique character counting
- ✅ Word counting
- ✅ SHA-256 hash generation
- ✅ Character frequency mapping
- ✅ Advanced filtering capabilities
- ✅ Natural language query support

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Storage**: In-memory (Map)
- **Hashing**: Crypto (built-in)

## Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Setup Instructions

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd string-analyzer-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Run locally**

```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## API Endpoints

### 1. Create/Analyze String

**POST** `/strings`

**Request Body:**

```json
{
  "value": "string to analyze"
}
```

**Success Response (201):**

```json
{
  "id": "sha256_hash_value",
  "value": "string to analyze",
  "properties": {
    "length": 17,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2
    }
  },
  "created_at": "2025-10-22T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Missing "value" field
- `409 Conflict`: String already exists
- `422 Unprocessable Entity`: Invalid data type

### 2. Get Specific String

**GET** `/strings/{string_value}`

**Success Response (200):**
Returns the stored string analysis

**Error Response:**

- `404 Not Found`: String does not exist

### 3. Get All Strings with Filtering

**GET** `/strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a`

**Query Parameters:**

- `is_palindrome`: boolean (true/false)
- `min_length`: integer (minimum string length)
- `max_length`: integer (maximum string length)
- `word_count`: integer (exact word count)
- `contains_character`: string (single character)

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "string1",
      "properties": {},
      "created_at": "2025-10-22T10:00:00Z"
    }
  ],
  "count": 1,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5
  }
}
```

### 4. Natural Language Filtering

**GET** `/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings`

**Supported Queries:**

- "all single word palindromic strings" → `word_count=1, is_palindrome=true`
- "strings longer than 10 characters" → `min_length=11`
- "strings containing the letter z" → `contains_character=z`
- "palindromic strings that contain the first vowel" → `is_palindrome=true, contains_character=a`

**Success Response (200):**

```json
{
  "data": [],
  "count": 0,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

### 5. Delete String

**DELETE** `/strings/{string_value}`

**Success Response (204):**
Empty response body

**Error Response:**

- `404 Not Found`: String does not exist

## Testing

You can test the API using curl, Postman, or any HTTP client.

### Example curl commands:

```bash
# Create a string
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'

# Get a specific string
curl http://localhost:3000/strings/racecar

# Get all palindromes
curl "http://localhost:3000/strings?is_palindrome=true"

# Natural language query
curl "http://localhost:3000/strings/filter-by-natural-language?query=single%20word%20palindromic%20strings"

# Delete a string
curl -X DELETE http://localhost:3000/strings/racecar
```

## Deployment

This API can be deployed to:

- Railway
- Heroku
- AWS (EC2, Elastic Beanstalk, Lambda)
- Digital Ocean
- Any other platform that supports Node.js

**Note:** Vercel and Render are not allowed for this cohort.

### Deployment Steps (Example for Railway):

1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Railway will auto-detect Node.js and deploy
4. Your API will be available at: `https://your-app.railway.app`

## Environment Variables

Currently, the only environment variable is:

- `PORT`: The port number (default: 3000)

## Project Structure

```
string-analyzer-api/
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## Dependencies

- **express**: Web framework for Node.js
- **cors**: Enable Cross-Origin Resource Sharing

## Author

Your Name - Backend Wizards Cohort

## License

MIT
