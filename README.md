# SkillSwap Backend Server

SkillSwap is a freelance micro-task marketplace platform backend. Clients can post tasks, freelancers can bid and deliver them, and admins can manage the ecosystem. It provides the core data layer, user management, project proposals handling, JWT authentication, and secure Stripe payments integration.

**Live Website Link**: [To Be Deployed]

## Purpose
The primary purpose of this server is to act as the robust backend engine for the SkillSwap website, providing secure RESTful API endpoints for:
- JWT Authentication (via secure HTTPOnly cookies)
- Role-based Access Control (Client, Freelancer, Admin)
- Full CRUD operations for Tasks, Proposals, and Users
- Stripe Checkout Session Generation and Payment Confirmation

## Key Features
- **Server-Side Pagination & Filtering**: Tasks are served with `limit`, `page`, `search` text, and `category` filtering directly from the MongoDB aggregations.
- **Role-Based Middlewares**: Strict boundary guards for clients (`verifyClient`), freelancers (`verifyFreelancer`), and admins (`verifyAdmin`).
- **HTTPOnly Cookies**: Secure authentication flow utilizing encrypted JWT tokens passed transparently via cookies to prevent XSS attacks.
- **Stripe Payments**: Safe payment processing workflow linking accepted proposals to Stripe Checkout securely.
- **Soft Delete/Block Mechanism**: Admins can block users, and task deletion cascades to clean up pending proposals automatically.

## NPM Packages Used
- `express` - High-performance web framework.
- `mongodb` - Native MongoDB Node.js driver for direct database interactions.
- `cors` - For managing Cross-Origin Resource Sharing.
- `dotenv` - For loading environment variables.
- `jsonwebtoken` - For generating secure JSON Web Tokens.
- `cookie-parser` - For parsing HTTP request cookies.
- `stripe` - For interacting with the Stripe Payment API.

## Setup Instructions

1. Clone the repository
2. Run `npm install` to install the dependencies.
3. Create a `.env` file in the root directory:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```
4. Start the server using `npm start`.
