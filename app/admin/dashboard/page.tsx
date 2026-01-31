// app/admin/dashboard/page.tsx - Fixed with dynamic export
import { createServerSupabaseClient } from '@/lib/supabaseServer'; // Uses service role key (no cookies)
import { revalidatePath } from 'next/cache';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  
  // Fetch data using service role key
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error loading data</h2>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Recent Users</h2>
            <span className="bg-cyan-100 text-cyan-800 text-sm font-medium px-3 py-1 rounded-full">
              {users?.length || 0} users
            </span>
          </div>
          
          {users?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    ID: {user.id.substring(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Admin Actions Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Database Actions</h2>
          <div className="space-y-3">
            <form action={clearPlaceholderData}>
              <button 
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow hover:shadow-md"
              >
                ??? Clear All Placeholder Data
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Deletes placeholder notifications, tasks, and rewards
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server Action - Fixed to return void (not a complex object)
async function clearPlaceholderData() {
  'use server';
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Clear different tables
    const tables = ['notifications', 'tasks', 'rewards'];
    
    for (const table of tables) {
      await supabase
        .from(table)
        .delete()
        .neq('id', 0);
    }
    
    // Revalidate the page to show updated data
    revalidatePath('/admin/dashboard');
    // This returns void, which is what Next.js expects
  } catch (error: any) {
    console.error('Error in clearPlaceholderData:', error);
    // You can add error handling here, but don't return a value
  }
}
