import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { staffService, StaffListItem } from '@/services/staffService';
import AddStaffModal from '@/components/AddStaffModal';
import { Plus, Pencil } from 'lucide-react';

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await staffService.getAll(true);
      setStaff(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff accounts, trainer status, and permissions.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" /> New staff
        </Button>
      </header>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="text-center border rounded-lg p-10">
          <p className="mb-4">No staff yet</p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add your first staff member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <Card key={s.user_id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={s.avatar_url || undefined} />
                    <AvatarFallback>{(s.first_name?.[0] || 'S')}{(s.last_name?.[0] || '').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{s.first_name} {s.last_name}</div>
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded border ${s.is_trainer ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'}`}>
                        {s.is_trainer ? 'TRAINER' : 'STAFF'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddStaffModal isOpen={showAdd} onClose={() => setShowAdd(false)} onStaffAdded={fetchData} />
    </div>
  );
};

export default StaffManagement;
