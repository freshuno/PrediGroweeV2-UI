import React, { useState } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { STATS_SERVICE_URL } from '@/Envs';
import StatsClient from '@/Clients/StatsClient';
import { useRouter } from 'next/router';
import { UserSurvey } from '@/types';

const COUNTRIES = [
  'Afghanistan',
  'Åland Islands',
  'Albania',
  'Algeria',
  'American Samoa',
  'Andorra',
  'Angola',
  'Anguilla',
  'Antarctica',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bermuda',
  'Bhutan',
  'Bolivia (Plurinational State of)',
  'Bonaire, Sint Eustatius and Saba',
  'Bosnia and Herzegovina',
  'Botswana',
  'Bouvet Island',
  'Brazil',
  'British Indian Ocean Territory',
  'Brunei Darussalam',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cayman Islands',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Christmas Island',
  'Cocos (Keeling) Islands',
  'Colombia',
  'Comoros',
  'Congo',
  'Congo, Democratic Republic of the',
  'Cook Islands',
  'Costa Rica',
  'Côte d’Ivoire',
  'Croatia',
  'Cuba',
  'Curaçao',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Falkland Islands (Malvinas)',
  'Faroe Islands',
  'Fiji',
  'Finland',
  'France',
  'French Guiana',
  'French Polynesia',
  'French Southern Territories',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Gibraltar',
  'Greece',
  'Greenland',
  'Grenada',
  'Guadeloupe',
  'Guam',
  'Guatemala',
  'Guernsey',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Heard Island and McDonald Islands',
  'Holy See',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran (Islamic Republic of)',
  'Iraq',
  'Ireland',
  'Isle of Man',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jersey',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Korea (Democratic People’s Republic of)',
  'Korea, Republic of',
  'Kuwait',
  'Kyrgyzstan',
  'Lao People’s Democratic Republic',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Macao',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Martinique',
  'Mauritania',
  'Mauritius',
  'Mayotte',
  'Mexico',
  'Micronesia (Federated States of)',
  'Moldova, Republic of',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Montserrat',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Caledonia',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'Niue',
  'Norfolk Island',
  'North Macedonia',
  'Northern Mariana Islands',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine, State of',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Pitcairn',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Réunion',
  'Romania',
  'Russian Federation',
  'Rwanda',
  'Saint Barthélemy',
  'Saint Helena, Ascension and Tristan da Cunha',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Martin (French part)',
  'Saint Pierre and Miquelon',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Sint Maarten (Dutch part)',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Georgia and the South Sandwich Islands',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Svalbard and Jan Mayen',
  'Sweden',
  'Switzerland',
  'Syrian Arab Republic',
  'Taiwan, Province of China',
  'Tajikistan',
  'Tanzania, United Republic of',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tokelau',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Turks and Caicos Islands',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'United States Minor Outlying Islands',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Venezuela (Bolivarian Republic of)',
  'Viet Nam',
  'Virgin Islands (British)',
  'Virgin Islands (U.S.)',
  'Wallis and Futuna',
  'Western Sahara',
  'Yemen',
  'Zambia',
  'Zimbabwe',
  'Other',
];

const SurveyPage = () => {
  const statsClient = new StatsClient(STATS_SERVICE_URL);
  const router = useRouter();
  const [formData, setFormData] = useState<UserSurvey>({
    name: '',
    surname: '',
    gender: '',
    age: 0,
    country: 'Poland',
    visionDefect: '',
    education: '',
    experience: '',
    acknowledgements: true,
  });
  const [isError, setIsError] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    if (name === 'age') {
      const num = value === '' ? 0 : parseInt(value, 10);
      setFormData((prev) => ({ ...prev, age: num }));
      setIsError(num < 1 || num > 120);
      return;
    }

    if (name === 'acknowledgements') {
      setFormData((prev) => ({ ...prev, acknowledgements: value === 'Yes' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const hasError = (fieldName: keyof UserSurvey): boolean => {
    if (!touchedFields[fieldName as string]) return false;
    const v = formData[fieldName];
    switch (fieldName) {
      case 'age':
        return !formData.age || formData.age < 1 || formData.age > 120;
      case 'acknowledgements':
        return typeof formData.acknowledgements !== 'boolean';
      default:
        return (v as unknown as string) === '';
    }
  };

  const isFormInvalid =
    isError ||
    !formData.name.trim() ||
    !formData.surname.trim() ||
    !formData.gender ||
    !formData.age ||
    formData.age < 1 ||
    formData.age > 120 ||
    !formData.country ||
    !formData.visionDefect ||
    !formData.education ||
    !formData.experience ||
    typeof formData.acknowledgements !== 'boolean';

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const payload = {
      ...formData,
      age: String(formData.age),
      acknowledgements: formData.acknowledgements ? 'Yes' : 'No',
    };
    try {
      await statsClient.saveUserSurveyAnswers(payload as unknown as UserSurvey);
      await router.push('/quiz');
    } catch {
      await router.push('/quiz');
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={5}>
      <Card sx={{ maxWidth: 500, margin: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Survey
          </Typography>
          <Typography variant="body2" align="center" gutterBottom>
            All fields are required. Please fill in every field to continue.
          </Typography>

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Name:"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={hasError('name')}
              helperText={hasError('name') ? 'This field is required' : ''}
              fullWidth
              margin="normal"
              placeholder="Name"
              required
            />

            <TextField
              label="Surname:"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              onBlur={() => handleBlur('surname')}
              error={hasError('surname')}
              helperText={hasError('surname') ? 'This field is required' : ''}
              fullWidth
              margin="normal"
              placeholder="Surname"
              required
            />

            <TextField
              select
              label="Gender:"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onBlur={() => handleBlur('gender')}
              error={hasError('gender')}
              helperText={hasError('gender') ? 'Please select your gender' : ''}
              fullWidth
              margin="normal"
              placeholder="Please select one of the options"
              required
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="prefer not to say">Prefer not to say</MenuItem>
            </TextField>

            <TextField
              label="Age:"
              type="number"
              name="age"
              value={formData.age === 0 ? '' : formData.age}
              error={isError || hasError('age')}
              helperText={hasError('age') ? 'Please enter a valid age (1–120)' : ''}
              onChange={handleChange}
              onBlur={() => handleBlur('age')}
              fullWidth
              margin="normal"
              placeholder="Age"
              inputProps={{ min: 1, max: 120 }}
              required
            />

            <TextField
              select
              label="Country of origin:"
              name="country"
              value={formData.country}
              onChange={handleChange}
              onBlur={() => handleBlur('country')}
              error={hasError('country')}
              helperText={hasError('country') ? 'Please select your country' : ''}
              fullWidth
              margin="normal"
              placeholder="Please select one of the options"
              required
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vision defect:"
              name="visionDefect"
              value={formData.visionDefect}
              onChange={handleChange}
              onBlur={() => handleBlur('visionDefect')}
              error={hasError('visionDefect')}
              helperText={hasError('visionDefect') ? 'Please select your vision status' : ''}
              fullWidth
              margin="normal"
              placeholder="Please select one of the options"
              required
            >
              <MenuItem value="I do not have any vision defects">
                I do not have any vision defects
              </MenuItem>
              <MenuItem value="I use correction glasses or contact lenses">
                I use correction glasses or contact lenses
              </MenuItem>
              <MenuItem value="I should use correction glasses or contact lenses but I do not use them now">
                I should use correction glasses or contact lenses but I do not use them now
              </MenuItem>
              <MenuItem value="I prefer not to say">I prefer not to say</MenuItem>
            </TextField>

            <TextField
              select
              label="Education:"
              name="education"
              value={formData.education}
              onChange={handleChange}
              onBlur={() => handleBlur('education')}
              error={hasError('education')}
              helperText={hasError('education') ? 'Please select your education level' : ''}
              fullWidth
              margin="normal"
              placeholder="Please select one of the options"
              required
            >
              <MenuItem value="Dental student">Dental student</MenuItem>
              <MenuItem value="Dental graduate">Dental graduate</MenuItem>
              <MenuItem value="General dental practitioner">General dental practitioner</MenuItem>
              <MenuItem value="Postgraduate orthodontic student">
                Postgraduate orthodontic student
              </MenuItem>
              <MenuItem value="Orthodontic specialist">Orthodontic specialist</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              select
              label="Experience with cephalometric analysis:"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              onBlur={() => handleBlur('experience')}
              error={hasError('experience')}
              helperText={hasError('experience') ? 'Please select your experience level' : ''}
              fullWidth
              margin="normal"
              placeholder="Please select one of the options"
              required
            >
              <MenuItem value="Less than 1 year">Less than 1 year</MenuItem>
              <MenuItem value="1-3 years">1-3 years</MenuItem>
              <MenuItem value="3-7 years">3-7 years</MenuItem>
              <MenuItem value="7-10 years">7-10 years</MenuItem>
              <MenuItem value="More than 10 years">More than 10 years</MenuItem>
            </TextField>

            <FormControl component="fieldset" margin="normal" required>
              <FormLabel component="legend">
                Would you like to be included in acknowledgements of our future papers?
              </FormLabel>
              <RadioGroup
                name="acknowledgements"
                value={formData.acknowledgements ? 'Yes' : 'No'}
                onChange={handleChange}
                row
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>

            <Box textAlign="center" mt={2}>
              <Button type="submit" variant="contained" color="primary" disabled={isFormInvalid}>
                Save
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SurveyPage;
