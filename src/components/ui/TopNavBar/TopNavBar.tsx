import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import Link from 'next/link';
import PrediGroweeIcon from '@/static/icons/PrediGroweeIcon';
import React from 'react';
import { useAuthContext } from '@/components/contexts/AuthContext';
import { useRouter } from 'next/router';
import MenuIcon from '@mui/icons-material/Menu';

export default function TopNavBar() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { userData, logout, isLoggedIn } = useAuthContext();

  const isAdmin = userData.role === 'admin' || userData.role === 'teacher';

  return (
    <AppBar position="static" elevation={5} style={{ background: '#f5f5f5' }}>
      <Toolbar>
        {/* Menu for mobile screens */}
        <Box
          sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between' }}
        >
          <Link href="/">
            <IconButton>
              <PrediGroweeIcon width="36px" />
            </IconButton>
          </Link>
          <IconButton
            onClick={() => {
              setDrawerOpen(true);
            }}
            color="primary"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Drawer for mobile menu, with same options as desktop */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
          }}
        >
          <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={() => {
              setDrawerOpen(false);
            }}
            onKeyDown={() => {
              setDrawerOpen(false);
            }}
          >
            <List>
              <ListItemButton onClick={() => router.push('/')}>
                <ListItemText primary="Home" />
              </ListItemButton>
              {isAdmin && (
                <ListItemButton onClick={() => router.push('/admin')}>
                  <ListItemText primary="Admin" />
                </ListItemButton>
              )}

              {isLoggedIn ? (
                <ListItemButton
                  onClick={async () => {
                    await router.push('/statistics');
                  }}
                >
                  <ListItemText primary="Statistics" />
                </ListItemButton>
              ) : null}
              <ListItemButton
                onClick={async () => {
                  await router.push('/privacy');
                }}
              >
                <ListItemText primary="Privacy" />
              </ListItemButton>
              <ListItemButton
                onClick={async () => {
                  await router.push('/contact');
                }}
              >
                <ListItemText primary="Contact" />
              </ListItemButton>
              <ListItemButton
                onClick={async () => {
                  await router.push('/about');
                }}
              >
                <ListItemText primary="About" />
              </ListItemButton>
              {isLoggedIn ? (
                <ListItemButton
                  onClick={async () => {
                    await router.push('/account');
                  }}
                >
                  <ListItemText primary="My account" />
                </ListItemButton>
              ) : null}
              <ListItemButton
                onClick={async () => {
                  if (isLoggedIn) {
                    await logout();
                    await router.push('/');
                  }
                  await router.push('/login');
                }}
              >
                <ListItemText primary={isLoggedIn ? 'Logout' : 'Login'} />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
        {/* menu for larger screens */}
        <Box
          sx={{
            flexGrow: 1,
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Link href="/">
            <IconButton>
              <PrediGroweeIcon width="36px" />
            </IconButton>
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          <Link href="/about">
            <Button color="primary">About</Button>
          </Link>
          <Link href={isLoggedIn ? '/quiz' : '/login'}>
            <Button
              color="primary"
              onClick={() => {
                if (router.pathname === '/quiz') {
                  router.reload();
                }
              }}
            >
              Get Started
            </Button>
          </Link>
          <Link href="/contact">
            <Button color="primary">Contact</Button>
          </Link>
          <Link href="/privacy">
            <Button color="primary">Privacy</Button>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <Button color="primary">Admin Panel</Button>
            </Link>
          )}
          <Button
            color="primary"
            onClick={handleClick}
            aria-controls="account-menu"
            aria-haspopup="true"
            sx={{ height: '36.5px' }}
          >
            Account
          </Button>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem
              disabled={!isLoggedIn}
              onClick={async () => {
                handleClose();
                await router.push('/statistics');
              }}
            >
              Statistics
            </MenuItem>
            <MenuItem
              disabled={!isLoggedIn}
              onClick={async () => {
                handleClose();
                await router.push('/account');
              }}
            >
              My account
            </MenuItem>
            <MenuItem
              disabled={!isLoggedIn}
              onClick={async () => {
                handleClose();
                logout();
                await router.push('/');
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
