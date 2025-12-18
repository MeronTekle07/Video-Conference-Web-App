"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Mail, Phone, Video, MessageSquare, Filter, UserPlus } from "lucide-react"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  department: string
  avatar?: string
  status: "online" | "offline" | "busy" | "away"
  lastSeen: string
  meetingsCount: number
  isFrequent: boolean
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
  })

  useEffect(() => {
    // Initialize with empty contacts - real data will be loaded from API
    setContacts([])
  }, [])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || contact.department === departmentFilter
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const departments = [...new Set(contacts.map((c) => c.department))]
  const frequentContacts = contacts.filter((c) => c.isFrequent)
  const onlineCount = contacts.filter((c) => c.status === "online").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "busy":
        return "bg-red-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault()
    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      role: newContact.role,
      department: newContact.department,
      status: "offline",
      lastSeen: "Just added",
      meetingsCount: 0,
      isFrequent: false,
    }

    setContacts([contact, ...contacts])
    setShowAddModal(false)
    setNewContact({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
    })
  }

  const handleDeleteContact = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      setContacts(contacts.filter((c) => c.id !== contactId))
      setSelectedContact(null)
    }
  }

  const startMeeting = (contact: Contact) => {
    const meetingId = `meeting-${Date.now()}`
    // In a real app, this would create a meeting and invite the contact
    window.location.href = `/meeting/${meetingId}?invite=${contact.email}`
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
            <p className="text-slate-400">Manage your team members and collaborators</p>
            <div className="flex space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">{onlineCount} Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-300">{contacts.length} Total Contacts</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Contact
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filters */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10 w-full sm:w-64"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-5 w-5 text-slate-400" />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input-field"
                    >
                      <option value="all">All Status</option>
                      <option value="online">Online</option>
                      <option value="busy">Busy</option>
                      <option value="away">Away</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="text-slate-400 text-sm">
                  {filteredContacts.length} of {contacts.length} contacts
                </div>
              </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="card hover:bg-slate-700/30 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {contact.name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${getStatusColor(contact.status)}`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-semibold truncate">{contact.name}</h3>
                          {contact.isFrequent && (
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                              Frequent
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-1">{contact.role}</p>
                        <p className="text-slate-500 text-sm mb-2">{contact.department}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {contact.email}
                          </div>
                          <div>{contact.lastSeen}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startMeeting(contact)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                          title="Start Meeting"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                          title="Edit Contact"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Meetings attended</span>
                      <span className="text-slate-300 font-medium">{contact.meetingsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <div className="card text-center py-16">
                <UserPlus className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-3">No contacts found</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  {searchTerm || departmentFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria to find the contacts you're looking for."
                    : "Start building your network by adding your first contact."}
                </p>
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Frequent Contacts */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Frequent Contacts</h3>
              <div className="space-y-3">
                {frequentContacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-3 p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {contact.name
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-slate-800 ${getStatusColor(contact.status)}`}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-slate-400 text-xs">{contact.status}</p>
                    </div>
                    <button
                      onClick={() => startMeeting(contact)}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                    >
                      <Video className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Contacts</span>
                  <span className="text-white font-semibold">{contacts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Online Now</span>
                  <span className="text-green-400 font-semibold">{onlineCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Departments</span>
                  <span className="text-white font-semibold">{departments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Frequent Contacts</span>
                  <span className="text-indigo-400 font-semibold">{frequentContacts.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-6">Add New Contact</h2>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter phone number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Role</label>
                  <input
                    type="text"
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter job role"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                  <select
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Add Contact
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Details Modal */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Contact Details</h2>
                <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-white text-xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">
                        {selectedContact.name
                          .split(" ")
                          .map((n) => n.charAt(0))
                          .join("")}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800 ${getStatusColor(selectedContact.status)}`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedContact.name}</h3>
                    <p className="text-slate-400">{selectedContact.role}</p>
                    <p className="text-slate-500 text-sm">{selectedContact.department}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white">{selectedContact.email}</p>
                    </div>
                  </div>

                  {selectedContact.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <p className="text-white">{selectedContact.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full ${getStatusColor(selectedContact.status)}`}></div>
                    <div>
                      <p className="text-sm text-slate-400">Status</p>
                      <p className="text-white capitalize">{selectedContact.status}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Activity</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Meetings attended</span>
                    <span className="text-white font-semibold">{selectedContact.meetingsCount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-slate-400 text-sm">Last seen</span>
                    <span className="text-white font-semibold">{selectedContact.lastSeen}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => startMeeting(selectedContact)}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Start Meeting
                  </button>
                  <button className="btn-outline flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
