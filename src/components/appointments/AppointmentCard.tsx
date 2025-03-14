import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  synced: boolean;
  notified: boolean;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onDelete,
}) => {
  return (
    <Card key={appointment.id} className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{appointment.type}</CardTitle>
          <Badge variant="outline">
            {appointment.synced ? "Sincronizzato" : "Non sincronizzato"}
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {appointment.date instanceof Date
              ? appointment.date.toLocaleDateString()
              : new Date(appointment.date).toLocaleDateString()}
            <Clock className="h-4 w-4 ml-3 mr-1" />
            {appointment.time}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{appointment.patientName}</p>
        <p className="text-sm text-muted-foreground">
          Durata: {appointment.duration} minuti
        </p>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(appointment)}
          >
            Modifica
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(appointment.id)}
          >
            Elimina
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
