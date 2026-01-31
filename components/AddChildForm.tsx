"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AddChildForm({ onChildAdded }: { onChildAdded?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [invitationCode, setInvitationCode] = useState("")

  const supabase = createClient()

  const generateNewCode = async () => {
    try {
      setLoading(true)
      // Get the parent's family
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (!profile?.family_id) throw new Error("No family found")

      // Generate a new invitation code
      const { data, error } = await supabase.rpc('generate_invitation_code_for_family', {
        family_id_param: profile.family_id
      })

      if (error) throw error
      
      setInvitationCode(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (!profile?.family_id) throw new Error("No family found")

      // Add child to database
      const { data, error } = await supabase
        .from('children')
        .insert({
          name: name,
          family_id: profile.family_id,
          points: 0,
          tasks_completed: 0
        })
        .select()
        .single()

      if (error) throw error

      // Reset form
      setName("")
      setIsOpen(false)
      if (onChildAdded) onChildAdded()
      
      alert("Child added successfully!")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
      >
        + Add Child
      </button>

      {/* Current Invitation Code */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Invitation Code</h3>
        <p className="text-sm text-gray-600 mb-3">
          Share this code with children to let them join your family
        </p>
        <div className="flex items-center gap-3">
          <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
            {invitationCode || "No code generated"}
          </code>
          <button
            onClick={generateNewCode}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
          >
            {loading ? "Generating..." : "Generate New Code"}
          </button>
        </div>
      </div>

      {/* Modal for adding child */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Child</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter child's name"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
