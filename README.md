# Webapp

Welcome to the Webapp repository! This is a simple backend API built using Node.js and Express.js.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **VS Code** (or any code editor of your choice)
2. **Node.js** (including npm)

You can download Node.js from [here](https://nodejs.org/).

## Run Locally

#### 1. Clone the Project

Start by cloning the repository to your local machine:

```bash
git clone https://github.com/CSY6225inc/webapp.git
```

#### 2. Go to the Project Directory
Navigate to the folder where the project has been cloned:
```
cd webapp
```
#### 3. Install Dependencies
Use npm to install the necessary modules for the application:
```
npm install
```
#### 4. Start the Server
Now that you have installed all dependencies, you can start the server with:
```
npm run start
```
### API Reference
Get All Items
To check the health of the API, use the following endpoint:

```http
GET /healthz
```

This endpoint performs a health check and inserts a record into the database.

Response Codes
* 200 OK: If the health check was successful and the record was inserted.
* 503 Service Unavailable: If there was an issue with inserting the record.
* 400 Bad Request: If the request contains a payload (the endpoint does not accept any body).
* 405 Method Not Allowed: If the request uses a method other than GET.
* 404 Wrong endpoint: If the request uses a wrong endpoint other than ```/healthz```.




