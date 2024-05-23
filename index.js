const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000



// middleware
app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.2rn0dld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const collectionMenu = client.db('bistroDB').collection('Menu')
        const collectionReviews = client.db('bistroDB').collection('reviews')
        const collectionCart = client.db('bistroBD').collection('carts')

        // cart collection
        app.get('/carts', async (req, res) => {
            const email = req.query.email
            const query = { 'current_info.email': email }
            const result = await collectionCart.find(query).toArray()
            res.send(result)
        })

        app.get('/menu', async (req, res) => {
            const menu = await collectionMenu.find().toArray()
            res.send(menu)
        })

        app.get('/reviews', async (req, res) => {
            const menu = await collectionReviews.find().toArray()
            res.send(menu)
        })

        // cart collection

        app.post('/carts', async (req, res) => {
            const carts = req.body
            console.log(carts)
            const result = await collectionCart.insertOne(carts)
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await collectionCart.deleteOne(query)
            res.send(result)
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Bistro Boss is server running')
})


app.listen(port, () => {
    console.log(`Bistro Boss Server port ${port}`)
})