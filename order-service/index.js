const express = require("express");
const app = express();
const PORT = process.env.PORT || 9090;
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const amqp = require("amqplib")
const order = require("./models/order")
const isAuthenticated = require("../authenticator")

var channel, connection;

mongoose.connect("mongodb://localhost/order-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Order SERVICE DB CONNECTED")
})

app.use(express.json());

// docker run command: docker run -p 5672:5672 rabbitmq
async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER")
}

function createOrder(products, userEmail){
 let total = 0;
 for(let t=0; t< products.length; t++ )  {
    total += products[t].price;
 } 
 const newOrder = new order({
    products,
    user: userEmail,
    total_price: total,
 })
 newOrder.save();
 return newOrder;
}

connect().then((res) => {
    channel.consume("ORDER", data => {
        const {products, userEmail} =  JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        channel.ack(data);
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({newOrder})
       ))
    }); 
});


app.listen(PORT, () => {
    console.log(`Order service is running at port ${PORT}`)
})