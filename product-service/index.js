const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const amqp = require("amqplib")
const product = require("./models/product")
const {isAuthenticated} = require("../authenticator")

var channel, connection, order;

mongoose.connect("mongodb://localhost/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Product SERVICE DB CONNECTED")
})

app.use(express.json());

// docker run command: docker run -p 5672:5672 rabbitmq
async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT")
}
connect();

app.post("/test", isAuthenticated, async(req, res) =>{
    return res.json({msg:"Done"})
    // 
})  

// Create a new product
app.post("/product/create", isAuthenticated,  async(req, res) => {
    const {name, description, price} = req.body;
    const newProduct = new Product({
        name, 
        description,
        price,
    });
    newProduct.save()
    return res.json(newProduct)
})

// Buy a product
app.post("/product/buy", isAuthenticated, async(req, res) => {
    const {ids} = req.body;
    const products =  await Product.find({_id: {$in : ids}});
    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
        products,
        userEmail: req.user?.email
    })
  ))
  channel.consume("PRODUCT", data => {
    console.log("CONSUMING PRODUCT queue")
    order = JSON.parse(data.content);
    channel.ack(data);
  });
  return res.json(order);
})

app.listen(PORT, () => {
    console.log(`Product service is running at port ${PORT}`)
})