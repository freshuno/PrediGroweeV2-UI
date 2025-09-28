import * as yup from 'yup';

const RegisterValidate = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
  retypePassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  notRobot: yup.string().required('You must confirm that you are not a robot'),
});
export default RegisterValidate;
