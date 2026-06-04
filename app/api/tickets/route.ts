import { NextRequest, NextResponse } from "next/server"

// In-memory storage for tickets (replace with database in production)
let tickets: Ticket[] = []

interface Message {
  id: string
  senderId: string
  senderName: string
  senderType: "user" | "admin"
  content: string
  createdAt: string
}

interface Ticket {
  id: string
  userId: string
  username: string
  subject: string
  category: string
  status: "open" | "answered" | "closed"
  priority: "low" | "medium" | "high"
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// GET - List tickets for a user or all tickets for admin
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const isAdmin = searchParams.get("admin") === "true"

  if (isAdmin) {
    // Return all tickets for admin
    return NextResponse.json({
      tickets: tickets.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    })
  }

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  // Return tickets for specific user
  const userTickets = tickets
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return NextResponse.json({ tickets: userTickets })
}

// POST - Create new ticket or add message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "create") {
      const { userId, username, subject, category, message, priority } = body

      if (!userId || !username || !subject || !message) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const newTicket: Ticket = {
        id: `TKT-${Date.now()}`,
        userId,
        username,
        subject,
        category: category || "general",
        status: "open",
        priority: priority || "medium",
        messages: [
          {
            id: `MSG-${Date.now()}`,
            senderId: userId,
            senderName: username,
            senderType: "user",
            content: message,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      tickets.push(newTicket)
      return NextResponse.json({ success: true, ticket: newTicket })
    }

    if (action === "reply") {
      const { ticketId, senderId, senderName, senderType, content } = body

      if (!ticketId || !senderId || !senderName || !content) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const ticketIndex = tickets.findIndex(t => t.id === ticketId)
      if (ticketIndex === -1) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      const newMessage: Message = {
        id: `MSG-${Date.now()}`,
        senderId,
        senderName,
        senderType: senderType || "user",
        content,
        createdAt: new Date().toISOString(),
      }

      tickets[ticketIndex].messages.push(newMessage)
      tickets[ticketIndex].updatedAt = new Date().toISOString()
      
      // Update status based on who replied
      if (senderType === "admin") {
        tickets[ticketIndex].status = "answered"
      } else {
        tickets[ticketIndex].status = "open"
      }

      return NextResponse.json({ success: true, ticket: tickets[ticketIndex] })
    }

    if (action === "close") {
      const { ticketId } = body
      const ticketIndex = tickets.findIndex(t => t.id === ticketId)
      
      if (ticketIndex === -1) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      tickets[ticketIndex].status = "closed"
      tickets[ticketIndex].updatedAt = new Date().toISOString()

      return NextResponse.json({ success: true, ticket: tickets[ticketIndex] })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a ticket (admin only)
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("id")

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID required" }, { status: 400 })
  }

  const ticketIndex = tickets.findIndex(t => t.id === ticketId)
  if (ticketIndex === -1) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  tickets.splice(ticketIndex, 1)
  return NextResponse.json({ success: true })
}
