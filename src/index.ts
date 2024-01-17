import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { prisma } from '../utils/prisma'
import * as bcrypt from 'bcrypt'
import { basicAuth } from 'hono/basic-auth'
import { bearerAuth } from 'hono/bearer-auth'
import { dateFormat } from '../utils/format'
import { sign, jwt } from 'hono/jwt'

const app = new Hono()

const salt = 10

// app.use('/users/*', basicAuth({
//   username: 'Syahrul',
//   password: 'admin123',
// })
// )

// const token = "Belajar hono"
// app.use('/users/*', bearerAuth({ token }))

app.use('/login', async (c) => {
  const { email, password } = await c.req.json()

  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  })

  if(!user) {
    return c.json({message: "User not found"}, {status: 404})
  }

  if(!user.password) {
    return c.json({message: "Password not set"}, {status: 404})
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if(isPasswordValid) {
    const payload = {
      id: user.id.toString(),
      name: user.username 
    }

    const secret = process.env.JWT_SECRET!

    const token = await sign(payload, secret)

    return c.json({
      data: {
        id: user.id.toString(),
        name: user.username
      },
      token: token
    })
  } else {
      return c.json({message: "Wrong password"}, {status: 403})
  }
})

app.use('/users', (c, next) => {
  const jwtMiddlewaare = jwt({
    secret: process.env.JWT_SECRET!
  })

  return jwtMiddlewaare(c, next)
})

app.get('/users', async (c) => {
    const users = await prisma.user.findMany()
    try {
      return c.json({
        data: users.map (user => {
          const { password, ...userWithoutPassword } = user
          return {
            ...userWithoutPassword,
            id: user.id.toString()
          }
        })
      })
    }
    catch (error) {
      console.log(error)
      return c.json({ message: "Data tidak bisa di dapatkan" }, { status: 500 })
    }
})
  
app.get('/siswa', async (c) => {
  const page: number = Number(c.req.query('page')) || 1
  const size: number = Number(c.req.query('size')) || 10
  const skip: number = (page - 1) * size

  const siswa = await prisma.siswa.findMany({
    take: size,
    skip: skip
  })

  try {
    return c.json({
      data: siswa.map(siswa => ({
        ...siswa,
        id: siswa.id.toString()
      }))
    })
  }
  catch (error) {
    console.log(error)
    return c.json({ message: "Data tidak bisa di dapatkan" }, { status: 500 })
  }
})
  
app.post('/users/tambah', async (c) => {
  try {
    const { username, email, password } = await c.req.json()
    const hashedPassword = bcrypt.hashSync(password, salt)
    const users = await prisma.user.create({
      data: { username, email, password:hashedPassword }
    })

    const usersInput = {
      ...users,
      id: users.id.toString(),
      createdAt: users.createdAt ? new Date() : null
    }

    return c.json({ message: "Data berhasil di tambahkan", data: usersInput }, { status: 201 })
  }
  catch (error) {
    console.log(error)
    return c.json({ message: "Gagal menambahkan data"}, { status: 500 })
  }
})

app.post('/siswa', async (c) => {
  try {
    const { nama, nisn, jk, alamat, } = await c.req.json()
    const siswa = await prisma.siswa.create({
      data: { nama, nisn, jk, alamat, }
    })

    const usersInput = {
      ...siswa,
      id: siswa.id.toString(),
      createdAt: Date.now()
    }

    return c.json({ message: "Data berhasil di tambahkan", data: usersInput }, { status: 201 })
  }
  catch (error) {
    console.log(error)
    return c.json({ message: "Gagal menambahkan data"}, { status: 500 })
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
