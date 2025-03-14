import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const ResetSetupButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetSetup = async () => {
    try {
      // Check if we're in Electron environment
      if (window.api) {
        const result = await window.api.resetSetup();

        if (result.success) {
          toast({
            title: "Setup Reset",
            description:
              "Setup has been reset successfully. Redirecting to setup page...",
          });

          // Redirect to setup page
          setTimeout(() => {
            navigate("/setup");
          }, 1500);
        } else {
          toast({
            title: "Reset Failed",
            description: result.error || "Failed to reset setup",
            variant: "destructive",
          });
        }
      } else {
        // For browser environment (development)
        localStorage.removeItem("setupCompleted");
        toast({
          title: "Setup Reset",
          description:
            "Setup has been reset successfully. Redirecting to setup page...",
        });

        // Redirect to setup page
        setTimeout(() => {
          navigate("/setup");
        }, 1500);
      }
    } catch (error) {
      console.error("Error resetting setup:", error);
      toast({
        title: "Reset Failed",
        description: "An error occurred while resetting setup",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="destructive" onClick={handleResetSetup} className="w-full">
      Reset Setup
    </Button>
  );
};

export default ResetSetupButton;
