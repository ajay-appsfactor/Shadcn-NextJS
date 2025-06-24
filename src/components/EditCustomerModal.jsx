"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import "react-tabs/style/react-tabs.css";
import { toast } from "react-toastify";

export function EditCustomerModal({ open, onOpenChange, userId, onSuccess }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    console.log("Customer Modal id is : ", userId);
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/customers/${userId}`);
        const data = await res.json();
        console.log("Modal user data", data);
        setUser(data);
      } catch (err) {
        toast.error("Failed to fetch user");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [open, userId]);

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Check all user data :", user.user_id);

    try {
      const res = await fetch(`/api/dashboard/customers/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Customer updated");
      onOpenChange(false);

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (err) {
      toast.error("Failed to update customer");
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update the customer's details below and click “Update” to save
            changes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              {/* First Name */}
              <div className="grid gap-3">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={user.first_name || ""}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="First Name"
                />
              </div>
              {/* Last Name */}
              <div className="grid gap-3">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={user.last_name || ""}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Last Name"
                />
              </div>
              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={user.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Last Name"
                />
              </div>
              {/* Company */}
              <div className="grid gap-3">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={user.company || ""}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="Company Name"
                />
              </div>
              {/* Gender */}
              <div className="grid gap-3">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={user.gender || ""}
                  onValueChange={(value) => handleChange("gender", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="cursor-pointer">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="cursor-pointer">
                Update
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p>User not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
