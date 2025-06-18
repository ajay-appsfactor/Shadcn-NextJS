"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import addCustomerSchema from "@/validation/addCustomerSchema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-tabs/style/react-tabs.css";
import { toast } from "react-toastify";

const AddCustomerPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  const noteTabs = ["Customer", "Quality", "Accounting", "Shipping", "Sales"];
  const placeholders = [
    "CUSTOMER NOTE",
    "QUALITY",
    "ACCOUNTING",
    "SHIPPING",
    "SALES",
  ];

  const formik = useFormik({
    initialValues: {
      email: "",
      first_name: "",
      last_name: "",
      company: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zip: "",
      phone: "",
      mobile: "",
      sendinvoice: "",
      conformance: "",
      password: "",
      shipping_firstname: "",
      shipping_lastname: "",
      shipping_company: "",
      shipping_address: "",
      shipping_city: "",
      shipping_state: "",
      shipping_country: "",
      shipping_zip: "",
      shipping_phone: "",
      shipping_mobile: "",
      terms: "",
      freight: "",
      note: "",
    },
    validationSchema: addCustomerSchema,
    onSubmit: async (values, { resetForm }) => {
      console.log(values);
      try {
        const res = await fetch("/api/dashboard/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const errorData = await res.json();
          toast.error(errorData.message || "Add Customer failed!");
          return;
        }
        toast.success("Add Customer Successful!");
        resetForm();
        router.push("/dashboard/customers");
      } catch (err) {
        toast.error("Add Customer failed!");
        console.error(err);
      }
    },
  });
  const inputProps = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
  });

  const renderError = (field) =>
    formik.touched[field] &&
    formik.errors[field] && (
      <p className="text-red-600 text-sm mt-1">{formik.errors[field]}</p>
    );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Add Customer</h2>
        <Link
          href="/dashboard/customers"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Back
        </Link>
      </div>

      {/* Checkbox */}
      <div className="mt-4 flex items-center space-x-2">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          checked
          readOnly
        />
        <span className="text-sm">Critical Customers</span>
      </div>

      {/* Login Details */}
      <div className="mt-6">
        <h2 className="text-lg font-medium">Login Details</h2>
      </div>

      <form onSubmit={formik.handleSubmit} className="mt-4 space-y-6">
        {/* Email & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="lowercase mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              {...inputProps("email")}
            />
            {renderError("email")}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-blue-200"
                {...inputProps("password")}
              />
              <span
                className="absolute right-3 top-[13px] cursor-pointer text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* LEFT COLUMN: Billing Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              Billing Details
            </h2>

            {/* Billing Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  {...inputProps("first_name")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {renderError("first_name")}
              </div>
              {/* Last Name */}
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  {...inputProps("last_name")}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {renderError("last_name")}
              </div>
            </div>
            {/* Company */}
            <div className="mt-4">
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700"
              >
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                {...inputProps("company")}
              />
              {renderError("company")}
            </div>
            {/* Address */}
            <div className="mt-4">
              <label htmlFor="address" className="block text-sm font-medium">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                {...inputProps("address")}
              />
              {renderError("address")}
            </div>
            {/* City, State, Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  {...inputProps("city")}
                />
                {renderError("city")}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  {...inputProps("state")}
                />
                {renderError("state")}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  {...inputProps("country")}
                />
                {renderError("country")}
              </div>
            </div>

            {/* Zip, Phone, Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="zip"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  {...inputProps("zip")}
                />
                {renderError("zip")}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formik.values.mobile}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Send Invoice */}
            <div className="mt-4">
              <label
                htmlFor="sendinvoice"
                className="block text-sm font-medium"
              >
                Send Invoice To
              </label>
              <input
                type="text"
                name="sendinvoice"
                value={formik.values.sendinvoice}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Certificate of Conformance */}
            <div className="mt-4">
              <label
                htmlFor="conformance"
                className="block text-sm font-medium"
              >
                Certificate Of Conformance
              </label>
              <input
                type="text"
                name="conformance"
                value={formik.values.conformance}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Shipping Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              Shipping Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping First Name
                </label>
                <input
                  type="text"
                  name="shipping_firstname"
                  value={formik.values.shipping_firstname}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Last Name
                </label>
                <input
                  type="text"
                  name="shipping_lastname"
                  value={formik.values.shipping_lastname}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Shipping Company
              </label>
              <input
                type="text"
                name="shipping_company"
                value={formik.values.shipping_company}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Shipping Address */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>
              <input
                type="text"
                name="shipping_address"
                value={formik.values.shipping_address}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Shipping City, State, Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping City
                </label>
                <input
                  type="text"
                  name="shipping_city"
                  value={formik.values.shipping_city}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping State
                </label>
                <input
                  type="text"
                  name="shipping_state"
                  value={formik.values.shipping_state}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Country
                </label>
                <input
                  type="text"
                  name="shipping_country"
                  value={formik.values.shipping_country}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Shipping Zip, Phone, Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Zip Code
                </label>
                <input
                  type="text"
                  name="shipping_zip"
                  value={formik.values.shipping_zip}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Phone
                </label>
                <input
                  type="text"
                  name="shipping_phone"
                  value={formik.values.shipping_phone}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Mobile
                </label>
                <input
                  type="text"
                  name="shipping_mobile"
                  value={formik.values.shipping_mobile}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Terms & Freight Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms
                </label>
                <Select
                  value={formik.values.terms}
                  onValueChange={(value) =>
                    formik.setFieldValue("terms", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freight Condition
                </label>
                <input
                  type="text"
                  name="freight"
                  value={formik.values.freight}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Notes with Tabs */}
            <div className="mt-4">
              <Tabs defaultValue="Customer" className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>

                <TabsList className="grid grid-cols-5 w-full mb-2">
                  {noteTabs.map((tab) => (
                    <TabsTrigger key={tab} value={tab}>
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {noteTabs.map((tab, index) => (
                  <TabsContent key={tab} value={tab}>
                    <textarea
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 min-h-[50px]"
                      name="note"
                      value={formik.values.note}
                      onChange={formik.handleChange}
                      placeholder={placeholders[index]}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center">
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 cursor-pointer rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? "Saving..." : "Add Customer"}
          </button>
          <button
            type="button"
            onClick={() => formik.resetForm()}
            className="ml-3 bg-gray-100 text-gray-700 px-4 py-2 cursor-pointer rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerPage;
