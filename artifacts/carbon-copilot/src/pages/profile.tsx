import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const profileSchema = z.object({
  homeCity: z.string().min(2, "City name is too short"),
  dietPreference: z.enum(["vegan", "vegetarian", "flexitarian", "omnivore"]),
  hasVehicle: z.boolean(),
  budgetSensitivity: z.enum(["low", "medium", "high"]),
  timeSensitivity: z.enum(["low", "medium", "high"]),
  typicalCommute: z.string().optional(),
  monthlyBudget: z.coerce.number().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      homeCity: "",
      dietPreference: "omnivore",
      hasVehicle: false,
      budgetSensitivity: "medium",
      timeSensitivity: "medium",
      typicalCommute: "",
      monthlyBudget: null,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        homeCity: profile.homeCity,
        dietPreference: profile.dietPreference,
        hasVehicle: profile.hasVehicle ?? false,
        budgetSensitivity: profile.budgetSensitivity,
        timeSensitivity: profile.timeSensitivity,
        typicalCommute: profile.typicalCommute ?? "",
        monthlyBudget: profile.monthlyBudget ?? null,
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    const payload = {
      ...values,
      monthlyBudget: values.monthlyBudget ?? undefined,
    };
    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Profile updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-8" role="status" aria-label="Loading profile settings">
        <span className="sr-only">Loading profile…</span>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Personalize Copilot to give you better tailored recommendations.
        </p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            We use these details to accurately estimate alternatives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              aria-label="Profile preferences form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="homeCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dietPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select diet preference">
                            <SelectValue placeholder="Select diet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="flexitarian">Flexitarian</SelectItem>
                          <SelectItem value="omnivore">Omnivore</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetSensitivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Sensitivity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select budget sensitivity">
                            <SelectValue placeholder="Select sensitivity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (Cost doesn&apos;t matter)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="high">High (Cost is critical)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeSensitivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Sensitivity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Select time sensitivity">
                            <SelectValue placeholder="Select sensitivity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (Time doesn&apos;t matter)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="high">High (Time is critical)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Carbon Budget (kg CO₂)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optional limit"
                          {...field}
                          value={field.value ?? ""}
                          aria-describedby="monthly-budget-desc"
                        />
                      </FormControl>
                      <FormDescription id="monthly-budget-desc">
                        Set a goal to keep emissions under
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="typicalCommute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical Commute</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 10 miles driving"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasVehicle"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base" htmlFor="has-vehicle-switch">
                        Personal Vehicle
                      </FormLabel>
                      <FormDescription>Do you own or lease a car?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        id="has-vehicle-switch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Do you own or lease a personal vehicle?"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto"
                aria-label={
                  updateMutation.isPending ? "Saving preferences…" : "Save preferences"
                }
              >
                {updateMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
