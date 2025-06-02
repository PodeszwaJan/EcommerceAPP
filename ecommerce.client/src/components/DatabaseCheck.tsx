import React, { useEffect, useState, useCallback } from 'react';
import { checkDatabaseConnection } from '../api/apiClient';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Outlet } from 'react-router-dom';

/**
 * DatabaseCheck Component
 * Verifies database connection before rendering child components.
 * Shows loading state and error messages if connection fails.
 * Automatically retries connection every 5 seconds.
 */
const DatabaseCheck: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState<boolean>(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const RETRY_INTERVAL = 5000; // 5 seconds

    const checkConnection = useCallback(async () => {
        try {
            setIsChecking(true);
            setError(null);
            await checkDatabaseConnection();
            setIsConnected(true);
            setRetryCount(0); // Reset retry count on successful connection
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to connect to the database');
            setIsConnected(false);
            setRetryCount(prev => prev + 1);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial connection check
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    // Automatic retry logic
    useEffect(() => {
        let retryTimer: NodeJS.Timeout;

        if (!isConnected && !isChecking) {
            retryTimer = setTimeout(() => {
                checkConnection();
            }, RETRY_INTERVAL);
        }

        return () => {
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
        };
    }, [isConnected, isChecking, checkConnection]);

    const getRetryMessage = () => {
        if (retryCount === 0) return '';
        return `Attempt ${retryCount}. Next retry in ${RETRY_INTERVAL / 1000} seconds...`;
    };

    if (isChecking || !isConnected) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'background.default',
                    zIndex: 9999,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        p: 3,
                        maxWidth: 400,
                        width: '100%'
                    }}
                >
                    {isChecking ? (
                        <>
                            <CircularProgress size={60} thickness={4} />
                            <Typography 
                                variant="h6"
                                sx={{
                                    color: 'text.primary',
                                    textAlign: 'center',
                                    fontWeight: 500
                                }}
                            >
                                Checking database connection...
                            </Typography>
                            {retryCount > 0 && (
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ textAlign: 'center' }}
                                >
                                    {getRetryMessage()}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <>
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    width: '100%',
                                    '& .MuiAlert-message': {
                                        width: '100%'
                                    }
                                }}
                            >
                                {error || 'Could not connect to the database'}
                            </Alert>
                            <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ textAlign: 'center' }}
                            >
                                {getRetryMessage()}
                            </Typography>
                            <Button 
                                variant="contained" 
                                onClick={checkConnection}
                                size="large"
                                sx={{
                                    minWidth: 200,
                                    py: 1
                                }}
                            >
                                Retry Now
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        );
    }

    return <Outlet />;
};

export default DatabaseCheck; 