# Country Currency & Exchange Rate API

A RESTful API that fetches country data from external APIs, stores it in MySQL, and provides comprehensive CRUD operations with exchange rate calculations.

## Features

- ✅ Fetch and cache country data from RestCountries API
- ✅ Integrate real-time exchange rates
- ✅ Calculate estimated GDP based on population and exchange rates
- ✅ Filter and sort countries by region, currency, and GDP
- ✅ Generate summary images with top countries
- ✅ Full CRUD operations
- ✅ Robust error handling and validation

## Tech Stack

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **HTTP Client**: Axios
- **Image Generation**: node-canvas

## Prerequisites

Before running this project, ensure you have:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd country-currency-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE countries_db;
```

Or using psql command line:

```bash
psql -U postgres
CREATE DATABASE countries_db;
\q
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=countries_db
```

### 5. Run the application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Refresh Country Data

**POST** `/countries/refresh`

Fetches fresh data from external APIs and updates the database.

```bash
curl -X POST http://localhost:3000/countries/refresh
```

**Response:**

```json
{
  "message": "Countries data refreshed successfully",
  "total_countries": 250
}
```

### 2. Get All Countries

**GET** `/countries`

Retrieve all countries with optional filters and sorting.

**Query Parameters:**

- `region` - Filter by region (e.g., `?region=Africa`)
- `currency` - Filter by currency code (e.g., `?currency=NGN`)
- `sort` - Sort results (e.g., `?sort=gdp_desc`)

**Examples:**

```bash
# Get all African countries
curl http://localhost:3000/countries?region=Africa

# Get countries using NGN currency
curl http://localhost:3000/countries?currency=NGN

# Get all countries sorted by GDP (descending)
curl http://localhost:3000/countries?sort=gdp_desc
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-22T18:00:00Z"
  }
]
```

### 3. Get Single Country

**GET** `/countries/:name`

Retrieve a specific country by name (case-insensitive).

```bash
curl http://localhost:3000/countries/Nigeria
```

**Response:**

```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1600.23,
  "estimated_gdp": 25767448125.2,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-22T18:00:00Z"
}
```

### 4. Delete Country

**DELETE** `/countries/:name`

Delete a country record by name.

```bash
curl -X DELETE http://localhost:3000/countries/Nigeria
```

**Response:**

```json
{
  "message": "Country deleted successfully"
}
```

### 5. Get API Status

**GET** `/status`

Get database statistics and last refresh timestamp.

```bash
curl http://localhost:3000/status
```

**Response:**

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00Z"
}
```

### 6. Get Summary Image

**GET** `/countries/image`

Retrieve the generated summary image (PNG format).

```bash
curl http://localhost:3000/countries/image --output summary.png
```

Opens an image showing:

- Total number of countries
- Top 5 countries by GDP
- Last refresh timestamp

## Error Responses

The API returns consistent error responses:

**404 Not Found:**

```json
{
  "error": "Country not found"
}
```

**400 Bad Request:**

```json
{
  "error": "Validation failed",
  "details": {
    "currency_code": "is required"
  }
}
```

**503 Service Unavailable:**

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from https://restcountries.com/v2/all"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

## Database Schema

### Countries Table

```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capital VARCHAR(255),
  region VARCHAR(255),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate NUMERIC(20, 6),
  estimated_gdp NUMERIC(30, 2),
  flag_url TEXT,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_region ON countries(region);
CREATE INDEX idx_currency ON countries(currency_code);
CREATE INDEX idx_gdp ON countries(estimated_gdp);
```

### Metadata Table

```sql
CREATE TABLE metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);
```

## Business Logic

### Currency Handling

- If a country has multiple currencies, only the first is stored
- If no currency exists:
  - `currency_code`: `null`
  - `exchange_rate`: `null`
  - `estimated_gdp`: `0`
- If currency not found in exchange rates:
  - `exchange_rate`: `null`
  - `estimated_gdp`: `null`

### GDP Calculation

```
estimated_gdp = (population × random(1000-2000)) ÷ exchange_rate
```

- Random multiplier is regenerated on each refresh
- Provides a rough economic estimate for comparison

### Update vs Insert

- Countries are matched by name (case-insensitive)
- Existing countries are updated with fresh data
- New countries are inserted
- GDP is recalculated with new random multiplier on each refresh

## Deployment

### Recommended Hosting Platforms

- **Railway** - https://railway.app (offers PostgreSQL add-on)
- **Heroku** - https://heroku.com (free PostgreSQL add-on)
- **AWS Elastic Beanstalk** with RDS PostgreSQL
- **PXXL App** or similar platforms

**Note:** Vercel and Render are not allowed per project requirements.

### Deployment Steps

1. Create a production PostgreSQL database (most platforms offer this as an add-on)
2. Set environment variables on your hosting platform
3. Deploy the application
4. Run the `/countries/refresh` endpoint to populate data

### Environment Variables for Production

```env
PORT=3000
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=countries_db
```

## Testing

### Manual Testing

Use the provided curl commands or tools like Postman/Insomnia.

### Test Checklist

- ✅ POST `/countries/refresh` populates database
- ✅ GET `/countries` returns all countries
- ✅ GET `/countries?region=Africa` filters correctly
- ✅ GET `/countries?currency=NGN` filters correctly
- ✅ GET `/countries?sort=gdp_desc` sorts correctly
- ✅ GET `/countries/:name` returns single country
- ✅ DELETE `/countries/:name` removes country
- ✅ GET `/status` shows correct statistics
- ✅ GET `/countries/image` serves PNG image
- ✅ Error responses follow consistent format

## Project Structure

```
country-currency-api/
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create from .env.example)
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
├── README.md          # This file
└── cache/             # Generated images directory (auto-created)
    └── summary.png    # Summary image (generated)
```

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
psql --version

# Test connection
psql -U postgres -d countries_db

# Check if PostgreSQL service is running (Linux/Mac)
sudo service postgresql status

# Or on Mac with Homebrew
brew services list | grep postgresql
```

### Canvas Installation Issues

If you encounter issues installing `node-canvas`, you may need system dependencies:

**Ubuntu/Debian:**

```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**macOS:**

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Windows:**
Follow the node-canvas Windows installation guide: https://github.com/Automattic/node-canvas/wiki/Installation:-Windows

### Port Already in Use

Change the PORT in your `.env` file:

```env
PORT=3001
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for learning or production.

## Support

For issues or questions:

- Open an issue on GitHub
- Check existing documentation
- Review API responses for error details

---

**Built with ❤️ for HNG Backend Stage 2**
