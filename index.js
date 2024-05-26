const express = require('express')
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
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


        const collectionUser = client.db('bistroDB').collection('Users')
        const collectionMenu = client.db('bistroDB').collection('Menu')
        const collectionReviews = client.db('bistroDB').collection('reviews')
        const collectionCart = client.db('bistroBD').collection('carts')

        // JWT related api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // middleware
        const verifyToken = (req, res, next) => {
            console.log('inside vefytoken', req.headers.authorization)
            if(!req.headers.authorization){
                return res.status(401).send({message: 'forbidden access'})
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.SECRET, (err, decoded)=>{
                if(err){
                    return res.status(401).send({message: 'forbidden access'})
                }
                req.decoded = decoded
                next()
            })
        }


        const verifyAdmin = async(req, res, next) =>{
            const email  = req.decoded.email
            const query = {email: email}
            const user = await collectionUser.findOne(query)
            const isAdmin = user?.role === 'admin';
            if(!isAdmin){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }

        // users related api

        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await collectionUser.find().toArray()
            res.send(result)
        })

        app.get('/users/admin/:email', verifyToken, async(req, res)=>{
            const email = req.params.email
            if(email !== req.decoded.email){
                return res.status(403).send({message: 'unauthorized access'})
            }
            const query = {email: email}
            const user = await collectionUser.findOne(query)
            let admin = false
            if(user){
                admin = user?.role === 'admin'
            }
            res.send({admin})
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            // insert email if user doesn't exists:
            // you can do this namy (1. email uniqe, 2. upsert 3 .simple checking)
            const query = { email: user.email }
            const existingUser = await collectionUser.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already extsis', insertedId: null })
            }
            const result = await collectionUser.insertOne(user)
            res.send(result)
        })

        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await collectionUser.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await collectionUser.deleteOne(query)
            res.send(result)
        })

        // menu related api

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

        app.post('/menu', verifyToken, verifyAdmin, async(req, res) =>{
            const item = req.body
            const result = await collectionMenu.insertOne(item)
            res.send(result)
        })

        app.delete('/menu/:id', verifyToken, verifyAdmin, async(req, res) =>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await collectionMenu.deleteOne(query)
            res.send(result)
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