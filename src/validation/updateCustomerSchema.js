import * as yup from "yup";

const updateCustomerSchema = yup.object().shape({
  email: yup
    .string()
    .email("Enter a valid email address")
    .required("Email is required"), 
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  company: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  zip: yup.string().matches(/^\d{5}$/, "Invalid ZIP code").required("Zip is required"),
  phone: yup.string().required("Phone is required")
});

export default updateCustomerSchema;
