import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertCircle,
  Database,
  Clock,
  RefreshCw,
} from "lucide-react";

interface BackupStatusProps {
  lastBackupTime?: string;
  backupLocation?: string;
  backupStatus?: "success" | "failed" | "in-progress";
  errorMessage?: string;
  backupProgress?: number;
  nextScheduledBackup?: string;
  onManualBackup?: () => void;
}

const BackupStatus: React.FC<BackupStatusProps> = ({
  lastBackupTime = "2023-06-10 14:30:00",
  backupLocation = "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
  backupStatus = "success",
  errorMessage = "",
  backupProgress = 100,
  nextScheduledBackup = "2023-06-11 02:00:00",
  onManualBackup = () => console.log("Manual backup triggered"),
}) => {
  const [timeUntilNextBackup, setTimeUntilNextBackup] = useState<string>("");

  useEffect(() => {
    // Calculate time until next backup
    const calculateTimeRemaining = () => {
      const now = new Date();
      const nextBackup = new Date(nextScheduledBackup);
      const diffMs = nextBackup.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeUntilNextBackup("Scheduled now");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilNextBackup(`${hours}h ${minutes}m`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextScheduledBackup]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusIcon = () => {
    switch (backupStatus) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (backupStatus) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800">Completato</Badge>
        );
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      case "in-progress":
        return (
          <Badge variant="secondary" className="animate-pulse">
            In corso
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Stato Backup</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onManualBackup}
            disabled={backupStatus === "in-progress"}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Backup Manuale
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {backupStatus === "in-progress" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Backup in corso...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
          )}

          {backupStatus === "failed" && errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errore di Backup</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Ultimo Backup</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {formatDate(lastBackupTime)}
                </span>
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Prossimo Backup</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {formatDate(nextScheduledBackup)}
                </span>
                <Badge variant="outline">{timeUntilNextBackup}</Badge>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground border-t">
            <p>Posizione: {backupLocation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupStatus;
