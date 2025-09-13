"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { Provider } from "@/type";

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
}

export default function ProviderSelector({ providers, selectedProviderId, onSelectProvider }: ProviderSelectorProps) {
  const activeProviders = providers.filter((p) => p.is_active);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Choose Your Provider</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeProviders.length > 0 ? (
          activeProviders.map((provider) => (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProviderId === provider.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => onSelectProvider(provider.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground">{provider.specialization}</p>
                  </div>
                  {/* You might want a specific 'is_recommended' flag in your DB for this */}
                  {provider.is_active && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No providers available for this service.</p>
          </div>
        )}
      </div>
    </div>
  );
}