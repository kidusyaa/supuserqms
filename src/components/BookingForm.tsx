// components/booking/BookingForm.tsx
"use-client";

import { useState } from 'react';
import { Service, Provider } from '@/type'; // Make sure your type path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Phone, Users } from 'lucide-react';

// Define the structure of the data our form will submit
export interface BookingData {
  name: string;
  phoneNumber: string;
  providerId?: string; // Optional, for when a specific provider is chosen
}

interface BookingFormProps {
  service: Service;
  onSubmit: (data: BookingData) => void; // A function to call when the form is submitted
  isSubmitting: boolean;
}

export default function BookingForm({ service, onSubmit, isSubmitting }: BookingFormProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // 'any' is a special value for the general queue.
  const [selectedProviderId, setSelectedProviderId] = useState<string>('any');
  const [error, setError] = useState('');

  const hasProviders = service.providers && service.providers.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }
    setError('');
    
    onSubmit({
      name,
      phoneNumber,
      // Only include the providerId if a specific one was selected
      providerId: selectedProviderId === 'any' ? undefined : selectedProviderId,
    });
  };

  return (
    <Card className="w-full max-w-lg bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Join the Queue</CardTitle>
        <CardDescription>Enter your details to get a spot for "{service.name}".</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection Logic */}
          {hasProviders && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choose a Specialist</Label>
              <RadioGroup
                value={selectedProviderId}
                onValueChange={setSelectedProviderId}
                className="gap-4"
              >
                {/* General Queue Option */}
                <Label htmlFor="provider-any" className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                  <RadioGroupItem value="any" id="provider-any" />
                  <Users className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="font-semibold">Any Available Specialist</p>
                    <p className="text-sm text-slate-500">Get the first available spot.</p>
                  </div>
                </Label>
                
                {/* Specific Provider Options */}
                {service.providers.map((provider) => (
                   <Label key={provider.id} htmlFor={`provider-${provider.id}`} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                    <RadioGroupItem value={provider.id} id={`provider-${provider.id}`} />
                    <User className="w-6 h-6 text-slate-700" />
                    <div>
                      <p className="font-semibold">{provider.name}</p>
                      <p className="text-sm text-slate-500">{provider.specialization}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* User Details Inputs */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold">Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g., John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              placeholder="e.g., 555-123-4567" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join Queue Now'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}