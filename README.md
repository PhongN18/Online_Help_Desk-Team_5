# Online Help Desk - Team 5

## Installation

### Clone the Repository

First, clone the repository to your local machine:

```
git clone https://github.com/PhongN18/Online_Help_Desk-Team_5.git
```

### Front-end Setup

1. **Navigate to the front-end directory**:

```
cd Online_Help_Desk-Team_5/OHD-frontend
```

2. **Install the necessary dependencies**:

```
npm install
```

### Back-end Setup

1. **Navigate to the back-end directory**:

```
cd Online_Help_Desk-Team_5/OHD-backend
```

2. **Install the necessary dependencies**:

```
npm install
```

3. **Set up environment variables:**

- **Create a `.env` file** in the root of the `OHD-backend` directory
- **Add** the following content to the `.env` file

```
JWT_SECRET=jwt_secret_key
REFRESH_SECRET=refresh_secret_key
```

- **Replace `jwt_secret_key` and `refresh_secret_key` with your own unique keys** (make sure they are 32 bytes / 256 characters long for security).

## Running the Application

### Front-end

To start the front-end, run the following commands:

1. **Navigate to the front-end directory** (if not already there):

```
cd Online_Help_Desk-Team_5/OHD-frontend
```

2. **Start the development server**:

```
npm run dev
```

The front-end should now be running on _http://localhost:5173_.

### Back-end

To start the back-end, run the following commands:

1. **Navigate to the back-end directory** (if not already there):

```
cd Online_Help_Desk-Team_5/OHD-backend
```

2. **Start the server**

```
node app.js
```

The back-end should now be running on _http://localhost:3000_

### Conclusion

By following these steps, you should be able to set up both the front-end and back-end of the **Online Help Desk project**.

If you encounter any issues or need further assistance, please feel free to reach out to the team.
