import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { clientAreaService } from '@/services/clientAreaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Package, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';

interface ClientPackage {
  id: string;
  sessions_remaining: number;
  expiry_date: string;
  status: string;
  packages: {
    name: string;
    sessions_included: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [clientPermissions, setClientPermissions] = useState({ can_book_sessions: false, can_cancel_sessions: false });

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const clientId = await clientAreaService.getClientIdFromUserId(user.id);
      if (!clientId) {
        toast({
          title: "Error",
          description: "Client profile not found",
          variant: "destructive",
        });
        navigate('/client/dashboard');
        return;
      }

      const [packagesResponse, permissions] = await Promise.all([
        supabase
          .from('client_packages')
          .select(`
            *,
            packages (name, sessions_included)
          `)
          .eq('client_id', clientId)
          .eq('status', 'active'),
        clientAreaService.getClientPermissions(clientId)
      ]);

      if (packagesResponse.error) throw packagesResponse.error;

      // Transform and filter packages
      const packagesData = (packagesResponse.data || []).map(pkg => ({
        id: pkg.id,
        sessions_remaining: pkg.sessions_remaining,
        expiry_date: pkg.expiry_date,
        status: pkg.status,
        packages: {
          name: (pkg.packages as any)?.name || 'Unknown Package',
          sessions_included: (pkg.packages as any)?.sessions_included || 0
        }
      }));

      // Filter to only active packages with remaining sessions
      const activePackages = packagesData.filter(pkg => 
        pkg.status === 'active' && pkg.sessions_remaining > 0
      );

      setPackages(activePackages);
      setClientPermissions(permissions);

      // Check if client can book sessions
      if (!permissions.can_book_sessions) {
        toast({
          title: "Booking Not Allowed",
          description: "Please contact your trainer to schedule sessions",
          variant: "destructive",
        });
        navigate('/client/dashboard');
        return;
      }

      if (activePackages.length === 0) {
        toast({
          title: "No Active Packages",
          description: "Please contact your trainer to purchase a package",
          variant: "destructive",
        });
        navigate('/client/dashboard');
        return;
      }

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load booking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    // Generate time slots from 6 AM to 10 PM
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const displayTime = format(new Date().setHours(hour, 0, 0, 0), 'h:mm a');
      
      // Check if slot is in the past (if today) or too soon (< 4 hours)
      const now = new Date();
      const slotDateTime = new Date(selectedDate!);
      slotDateTime.setHours(hour, 0, 0, 0);
      
      const isToday = format(selectedDate!, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const isAvailable = !isToday || isAfter(slotDateTime, fourHoursFromNow);

      slots.push({
        time: displayTime,
        available: isAvailable
      });
    }
    setAvailableSlots(slots);
  };

  const isPackageExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const weekFromNow = addDays(new Date(), 7);
    return isBefore(expiry, weekFromNow);
  };

  const isPackageExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    return isBefore(expiry, new Date());
  };

  const handlePackageSelect = (pkg: ClientPackage) => {
    if (isPackageExpired(pkg.expiry_date)) return;
    setSelectedPackage(pkg);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Don't allow booking in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(date, today)) return;

    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string, available: boolean) => {
    if (!available) return;
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedPackage || !selectedDate || !selectedTime || !user) return;

    try {
      setBookingLoading(true);
      
      const clientId = await clientAreaService.getClientIdFromUserId(user.id);
      if (!clientId) throw new Error('Client not found');

      // Create the session
      await clientAreaService.bookSession({
        clientId,
        packageId: selectedPackage.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: 60 // Default duration
      });

      toast({
        title: "Session Booked Successfully!",
        description: `Your session is scheduled for ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}`,
      });

      navigate('/client/sessions');

    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book a Session</h1>
          <p className="text-muted-foreground">
            Schedule your next training session
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/client/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium">Select Package</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium">Date & Time</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="font-medium">Confirmation</span>
        </div>
      </div>

      {/* Step 1: Package Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Select a Package
            </CardTitle>
            <CardDescription>
              Choose which package you'd like to use for your session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {packages.length > 0 ? (
              <div className="grid gap-4">
                {packages.map((pkg) => {
                  const expired = isPackageExpired(pkg.expiry_date);
                  const expiringSoon = isPackageExpiringSoon(pkg.expiry_date);
                  
                  return (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        expired 
                          ? 'opacity-50 cursor-not-allowed bg-muted' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{pkg.packages.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pkg.sessions_remaining} of {pkg.packages.sessions_included} sessions remaining
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge variant={expired ? 'destructive' : 'secondary'}>
                              Expires: {format(new Date(pkg.expiry_date), 'MMM d, yyyy')}
                            </Badge>
                            {expiringSoon && !expired && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!expired && (
                          <Button size="sm">
                            Select Package
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Packages</h3>
                <p className="text-muted-foreground">
                  Please contact your trainer to purchase a training package.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Time Selection */}
      {currentStep === 2 && selectedPackage && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Select Date
              </CardTitle>
              <CardDescription>
                Choose a date for your session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => 
                  isBefore(date, new Date()) || 
                  isAfter(date, addDays(new Date(), 30))
                }
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Time
              </CardTitle>
              <CardDescription>
                {selectedDate 
                  ? `Available times for ${format(selectedDate, 'MMMM d, yyyy')}` 
                  : 'Please select a date first'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot.time, slot.available)}
                      className="justify-center"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a date to see available time slots
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons for Step 2 */}
      {currentStep === 2 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
          <Button 
            onClick={() => setCurrentStep(3)}
            disabled={!selectedDate || !selectedTime}
          >
            Continue to Confirmation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && selectedPackage && selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm Your Booking
            </CardTitle>
            <CardDescription>
              Please review your booking details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Package Details</h4>
                <p className="text-sm text-muted-foreground">{selectedPackage.packages.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPackage.sessions_remaining - 1} sessions will remain after booking
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Session Details</h4>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTime} (60 minutes)
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Date & Time
              </Button>
              <Button 
                onClick={handleBooking}
                disabled={bookingLoading}
                className="min-w-[120px]"
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookSession;