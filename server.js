/* eslint-disable no-console */
const express = require('express')
const { join } = require('path')
const morgan = require('morgan')
cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
)

const MongoClient = require('mongodb').MongoClient
const uri =
    'mongodb+srv://auth0:pDHdgTmehRGRxm8Q@cluster0-p2vrx.mongodb.net/test?retryWrites=true&w=majority'
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
const port = process.env.SERVER_PORT || 3000

const COLLECTION = {
    USERS: 'users',
    TODOS: 'todos',
}

const BD_NAME = {
    DEFAULT: 'db-name',
}

app.use(morgan('dev'))
app.use(express.static(join(__dirname, 'build')))

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

app.route('/todos')
    .get(async (req, res, next) => {
        const { user } = req.query

        await client.connect(async err => {
            const collection = client.db(BD_NAME.DEFAULT).collection(COLLECTION.TODOS)

            try {
                return await collection.find({ userId: user }).toArray((err, tasks) => {
                    return res.send(tasks)
                })
            } catch (e) {
                console.log(e)
            }
        })
    })
    .post(async (req, res, next) => {
        const { text, user } = req.body

        try {
            await addTodo(text, user)
            res.send({ message: 'Task added' })
        } catch (e) {
            console.log('e', e)
        }
    })

async function addTodo(text = 'My todo', userId) {
    await client.connect(err => {
        const collection = client.db(BD_NAME.DEFAULT).collection(COLLECTION.TODOS)

        try {
            collection.insertOne({ text: text, userId: userId }, (err, result) => {
                console.log('result', result)
                client.close()
            })
        } catch (e) {
            console.log(e)
        }
    })
}
