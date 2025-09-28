import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
  Modal,
  IconButton,
  Backdrop,
  Fade,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Link,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IMAGES_SERVICE_URL, QUIZ_SERVICE_URL } from '@/Envs';
import { Parameter } from '@/types';
import ImagesClient from '@/Clients/ImagesClient';
import QuizClient from '@/Clients/QuizClient';
import Image from 'next/image';
import theme from '@/theme';
import axios from 'axios';

type AboutContent = {
  introduction: {
    title: string;
    content: string;
  };
  publications: {
    authors: string;
    year: string;
    title: string;
    publication: string;
    doi: string;
  }[];
  faq: {
    title: string;
    content: string;
  }[];
  team: {
    coordinator: {
      role: string;
      name: string;
      affiliation: string;
    };
    support: {
      name: string;
      affiliation: string;
    }[];
    developer: {
      role: string;
      name: string;
      affiliation: string;
    };
  };
};

type AboutProps = {
  content: AboutContent;
};

export default function About({ content }: AboutProps) {
  const [parameters, setParameters] = React.useState<Parameter[]>([]);
  const [images, setImages] = React.useState<Record<number, string>>({});
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);
  const quizClient = React.useMemo(() => new QuizClient(QUIZ_SERVICE_URL), []);
  const mobile = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    const loadParameters = async () => {
      try {
        const data = await quizClient.getAllParameters();
        setParameters(data);
      } catch (error) {
        console.error('Failed to load parameters:', error);
      }
    };
    loadParameters();
  }, [quizClient]);

  const fetchImage = React.useCallback(
    async (paramId: number) => {
      if (!paramId) {
        return;
      }
      try {
        const response = await imagesClient.getParamImage(paramId);
        if (response instanceof Blob) {
          return URL.createObjectURL(response);
        }
        throw new Error('Response is not a Blob');
      } catch (error) {
        console.error('Failed to fetch image:', error);
        return '';
      }
    },
    [imagesClient]
  );

  React.useEffect(() => {
    if (parameters.length > 0) {
      parameters.forEach(async (param) => {
        const url = await fetchImage(param.id);
        if (url) setImages((prev) => ({ ...prev, [param.id]: url }));
      });
    }
  }, [parameters, fetchImage]);

  return (
    <>
      <TopNavBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Introduction Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {content.introduction.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {content.introduction.content}
          </Typography>

          {!!content?.publications && (
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Publications
            </Typography>
          )}
          {content?.publications?.map((pub, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {pub.authors} ({pub.year}). <em>{pub.title}</em>. {pub.publication}.
              </Typography>
              <Link href={pub.doi} target="_blank" rel="noopener noreferrer">
                {pub.doi}
              </Link>
            </Box>
          ))}
        </Paper>

        {/* FAQ Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Frequently Asked Questions
          </Typography>
          {content.faq.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{faq.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  dangerouslySetInnerHTML={{ __html: faq.content }}
                  sx={{ '& a': { color: 'primary.main' } }}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        {/* Team Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Our Team
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {content.team.coordinator.role}
            </Typography>
            <Typography>{content.team.coordinator.name}</Typography>
            <Typography color="text.secondary">{content.team.coordinator.affiliation}</Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Content and substantive support
            </Typography>
            {content.team.support.map((member, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography>{member.name}</Typography>
                <Typography color="text.secondary">{member.affiliation}</Typography>
              </Box>
            ))}
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              {content.team.developer.role}
            </Typography>
            <Typography>{content.team.developer.name}</Typography>
            <Typography color="text.secondary">{content.team.developer.affiliation}</Typography>
          </Box>
        </Paper>

        {/* Parameters Section */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Cephalometric Parameters
          </Typography>

          <Grid container spacing={3}>
            {parameters.map((param) => (
              <Grid item xs={12} sm={6} md={4} key={param.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      '& .zoom-button': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="350"
                      image={images[param.id] || '/no_image.png'}
                      alt={param.name}
                      sx={{ objectFit: 'contain', px: 1, bgcolor: 'grey.50' }}
                    />
                    {!mobile && (
                      <IconButton
                        className="zoom-button"
                        onClick={() => setSelectedImage(images[param.id])}
                        sx={{
                          position: 'absolute',
                          right: 12,
                          top: 24,
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                          },
                        }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h3">
                      {param.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {param.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Reference Value: {param.referenceValues}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Image Modal */}
        <Modal
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Fade in={!!selectedImage}>
            <Box
              sx={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
              }}
            >
              <IconButton
                onClick={() => setSelectedImage(null)}
                sx={{
                  position: 'absolute',
                  right: -40,
                  top: -40,
                  color: 'white',
                }}
              >
                <CloseIcon />
              </IconButton>
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt="Zoomed parameter"
                  width={700}
                  height={700}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                  }}
                />
              )}
            </Box>
          </Fade>
        </Modal>
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const res = await axios.get(`http://frontend:3000/api/content/about`, {
    withCredentials: true,
  });
  const { content } = res.data;

  return {
    props: {
      content,
    },
  };
}
