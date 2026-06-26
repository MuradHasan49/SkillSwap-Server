const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const stripe = require("stripe");

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:5173"],
  })
);

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db("SkillSwap");
const usersCollection = db.collection("user");
const tasksCollection = db.collection("tasks");
const proposalsCollection = db.collection("proposals");
const paymentsCollection = db.collection("payments");
const reviewsCollection = db.collection("reviews");

async function run() {
  try {
    // await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.dir(error);
  }
}
run().catch(console.dir);

// ==========================================
// JWT AUTHENTICATION
// ==========================================
app.post("/auth/jwt", async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).send({ message: "Email is required" });
  const token = jwt.sign({ email, role }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

app.post("/auth/logout", async (req, res) => {
  res.clearCookie("token", { maxAge: 0 }).send({ success: true });
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "Unauthorized access" });

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized access" });
    req.user = decoded;
    next();
  });
};

const verifyRole = (allowedRoles) => async (req, res, next) => {
  const email = req.user?.email;
  const user = await usersCollection.findOne({ email });
  if (!user) return res.status(403).send({ message: `User not found for email: ${email}` });
  if (!allowedRoles.includes(user.role) && user.role !== "admin") {
    return res.status(403).send({ message: "Forbidden: Access restricted" });
  }
  if (user.isBlocked) {
    return res.status(403).send({ message: "Forbidden: User is blocked" });
  }
  req.dbUser = user;
  next();
};

const verifyAdmin = verifyRole(["admin"]);
const verifyClient = verifyRole(["client"]);
const verifyFreelancer = verifyRole(["freelancer"]);

// ==========================================
// USERS API
// ==========================================
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: "User already exists", insertedId: null });
    }
    user.createdAt = new Date();
    user.isBlocked = false;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to create user", error });
  }
});

app.get("/users/me", verifyToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ email: req.user.email });
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user", error });
  }
});

app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch users", error });
  }
});

app.patch("/users/:id/block", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { isBlocked: true } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to block user", error });
  }
});

app.patch("/users/:id/unblock", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { isBlocked: false } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to unblock user", error });
  }
});

app.get("/freelancers/top", async (req, res) => {
  try {
    const freelancers = await usersCollection.find({ role: "freelancer", isBlocked: false }).limit(6).toArray();
    res.send(freelancers);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch top freelancers", error });
  }
});

app.patch("/users/profile", verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const { name, image, skills, bio, hourlyRate } = req.body;
    const update = { $set: { name, image, skills, bio, hourlyRate } };
    const result = await usersCollection.updateOne({ email }, update);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update profile", error });
  }
});

// ==========================================
// TASKS API
// ==========================================
app.post("/tasks", verifyToken, verifyClient, async (req, res) => {
  try {
    const task = req.body;
    task.client_email = req.user.email;
    task.status = "open";
    task.createdAt = new Date();
    const result = await tasksCollection.insertOne(task);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to post task", error });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || "";
    const category = req.query.category || "";

    const query = { status: "open" };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (category && category.toLowerCase() !== "all") {
      query.category = category;
    }

    const total = await tasksCollection.countDocuments(query);
    const tasks = await tasksCollection.find(query).skip((page - 1) * limit).limit(limit).toArray();

    res.send({ tasks, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch tasks", error });
  }
});

app.get("/tasks/featured", async (req, res) => {
  try {
    const tasks = await tasksCollection.find({ status: "open" }).sort({ createdAt: -1 }).limit(6).toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch featured tasks", error });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    res.send(task);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch task", error });
  }
});

app.get("/client/tasks", verifyToken, verifyClient, async (req, res) => {
  try {
    const email = req.user.email;
    const tasks = await tasksCollection.find({ client_email: email }).toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch client tasks", error });
  }
});

app.patch("/tasks/:id", verifyToken, verifyClient, async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.user.email;
    const updates = req.body;
    const query = { _id: new ObjectId(id), client_email: email, status: "open" };
    
    // Do not allow status or sensitive fields override through edit task
    delete updates._id;
    delete updates.status;
    delete updates.client_email;

    const result = await tasksCollection.updateOne(query, { $set: updates });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update task", error });
  }
});

app.delete("/tasks/:id", verifyToken, verifyClient, async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.user.email;
    
    const query = { _id: new ObjectId(id), client_email: email, status: "open" };
    const result = await tasksCollection.deleteOne(query);
    if (result.deletedCount === 1) {
      await proposalsCollection.deleteMany({ task_id: id });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete task", error });
  }
});

app.delete("/admin/tasks/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete task", error });
  }
});

// ==========================================
// PROPOSALS API
// ==========================================
app.post("/proposals", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const proposal = req.body;
    proposal.freelancer_email = req.user.email;
    
    const existing = await proposalsCollection.findOne({ task_id: proposal.task_id, freelancer_email: req.user.email });
    if (existing) return res.status(400).send({ message: "You already submitted a proposal for this task" });

    proposal.status = "pending";
    proposal.submitted_at = new Date();
    const result = await proposalsCollection.insertOne(proposal);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to submit proposal", error });
  }
});

app.get("/tasks/:taskId/proposals", verifyToken, verifyClient, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const proposals = await proposalsCollection.find({ task_id: taskId }).toArray();
    res.send(proposals);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch proposals", error });
  }
});

app.patch("/proposals/:id/accept", verifyToken, verifyClient, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await proposalsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "accepted" } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to accept proposal", error });
  }
});

app.patch("/proposals/:id/reject", verifyToken, verifyClient, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await proposalsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: "rejected" } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to reject proposal", error });
  }
});

app.get("/freelancer/proposals", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const email = req.user.email;
    const proposals = await proposalsCollection.find({ freelancer_email: email }).toArray();
    res.send(proposals);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch freelancer proposals", error });
  }
});

// ==========================================
// FREELANCER DELIVERY & EARNINGS API
// ==========================================
app.get("/freelancer/active-projects", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const email = req.user.email;
    const proposals = await proposalsCollection.find({ freelancer_email: email, status: "accepted" }).toArray();
    const taskIds = proposals.map(p => new ObjectId(p.task_id));
    const tasks = await tasksCollection.find({ _id: { $in: taskIds } }).toArray();
    res.send(tasks);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch active projects", error });
  }
});

app.patch("/tasks/:id/deliver", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const id = req.params.id;
    const { deliverable_url } = req.body;
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "completed", deliverable_url } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to deliver task", error });
  }
});

app.get("/freelancer/earnings", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const email = req.user.email;
    const payments = await paymentsCollection.find({ freelancer_email: email, payment_status: "success" }).toArray();
    res.send(payments);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch earnings", error });
  }
});

// ==========================================
// PAYMENT API (STRIPE)
// ==========================================
app.post("/create-checkout-session", verifyToken, verifyClient, async (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId || !ObjectId.isValid(proposalId)) return res.status(400).send({ message: "Invalid proposal ID" });

    const proposal = await proposalsCollection.findOne({ _id: new ObjectId(proposalId) });
    if (!proposal) return res.status(404).send({ message: "Proposal not found" });

    const task = await tasksCollection.findOne({ _id: new ObjectId(proposal.task_id) });

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: task.title,
            },
            unit_amount: proposal.proposed_budget * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/client`,
      metadata: {
        task_id: task._id.toString(),
        proposal_id: proposal._id.toString(),
        client_email: req.user.email,
        freelancer_email: proposal.freelancer_email,
        amount: proposal.proposed_budget,
      }
    });

    res.send({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ message: "Failed to create checkout session", error: error.message });
  }
});

app.post("/payment/confirm", async (req, res) => {
  try {
    const { session_id } = req.body;
    const session = await stripeClient.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === "paid") {
      const { task_id, proposal_id, client_email, freelancer_email, amount } = session.metadata;

      const existing = await paymentsCollection.findOne({ transaction_id: session_id });
      if (existing) return res.send({ message: "Already recorded", payment: existing });

      const payment = {
        client_email,
        freelancer_email,
        task_id,
        amount: parseFloat(amount),
        transaction_id: session_id,
        payment_status: "success",
        paid_at: new Date()
      };
      
      await paymentsCollection.insertOne(payment);
      await tasksCollection.updateOne({ _id: new ObjectId(task_id) }, { $set: { status: "in-progress" } });

      res.send({ success: true, payment });
    } else {
      res.status(400).send({ message: "Payment not completed" });
    }
  } catch (error) {
    res.status(500).send({ message: "Failed to confirm payment", error });
  }
});

app.get("/transactions", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const payments = await paymentsCollection.find().sort({ paid_at: -1 }).toArray();
    res.send(payments);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch transactions", error });
  }
});

// ==========================================
// GLOBAL & DASHBOARD STATS API
// ==========================================
app.get("/stats", async (req, res) => {
  try {
    const totalUsers = await usersCollection.countDocuments();
    const totalTasks = await tasksCollection.countDocuments();
    const payments = await paymentsCollection.find({ payment_status: "success" }).toArray();
    const totalPayout = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.send({ totalUsers, totalTasks, totalPayout });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch stats", error });
  }
});

app.get("/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await usersCollection.countDocuments();
    const totalTasks = await tasksCollection.countDocuments();
    const activeTasks = await tasksCollection.countDocuments({ status: "in-progress" });
    const payments = await paymentsCollection.find({ payment_status: "success" }).toArray();
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.send({ totalUsers, totalTasks, activeTasks, totalRevenue });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch admin stats", error });
  }
});

app.get("/client/stats", verifyToken, verifyClient, async (req, res) => {
  try {
    const email = req.user.email;
    const totalTasks = await tasksCollection.countDocuments({ client_email: email });
    const openTasks = await tasksCollection.countDocuments({ client_email: email, status: "open" });
    const inProgressTasks = await tasksCollection.countDocuments({ client_email: email, status: "in-progress" });
    const payments = await paymentsCollection.find({ client_email: email, payment_status: "success" }).toArray();
    const totalSpent = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.send({ totalTasks, openTasks, inProgressTasks, totalSpent });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch client stats", error });
  }
});

app.get("/freelancer/stats", verifyToken, verifyFreelancer, async (req, res) => {
  try {
    const email = req.user.email;
    const totalProposals = await proposalsCollection.countDocuments({ freelancer_email: email });
    const pendingProposals = await proposalsCollection.countDocuments({ freelancer_email: email, status: "pending" });
    const acceptedProposals = await proposalsCollection.countDocuments({ freelancer_email: email, status: "accepted" });
    const payments = await paymentsCollection.find({ freelancer_email: email, payment_status: "success" }).toArray();
    const totalEarnings = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.send({ totalProposals, pendingProposals, acceptedProposals, totalEarnings });
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch freelancer stats", error });
  }
});

app.get("/", (req, res) => {
  res.send("SkillSwap Server is running...");
});

app.listen(port, () => {
  console.log(`SkillSwap Server is running on port: ${port}`);
});
// restart nodemon again
