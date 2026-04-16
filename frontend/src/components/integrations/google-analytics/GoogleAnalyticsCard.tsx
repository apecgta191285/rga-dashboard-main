import { Button } from '../../ui/button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { toast } from 'sonner';
import { useIntegrationStatus } from '../../../hooks/useIntegrationStatus';
import { useGA4OAuthFlow } from '../../../hooks/useGA4OAuthFlow';
import { PropertySelectionDialog } from './PropertySelectionDialog';
import { useEffect, useMemo } from 'react';
import { useSearch } from 'wouter';
import { DataSourceCard } from '../DataSourceCard';

interface GoogleAnalyticsCardProps {
    platform: {
        id: string;
        name: string;
        icon: any;
        color: string;
        description: string;
    };
}

export function GoogleAnalyticsCard({ platform }: GoogleAnalyticsCardProps) {
    const search = useSearch();
    const searchParams = useMemo(() => new URLSearchParams(search), [search]);

    const { status, ga4Account, disconnectGoogleAnalytics, syncGoogleAnalytics, isSyncing, refetch } = useIntegrationStatus();



    // Wire up OAuth flow with auto-refetch on success
    const {
        isConnecting,
        startGA4Flow,
        tempProperties,
        fetchTempProperties,
        completeConnection,
        cancelFlow
    } = useGA4OAuthFlow({
        onSuccess: () => {
            refetch();
        }
    });

    // Handle OAuth callback parameters
    useEffect(() => {
        const statusParam = searchParams.get('status');
        const tempTokenParam = searchParams.get('tempToken');
        const errorParam = searchParams.get('error');
        const platformParam = searchParams.get('platform');

        // Only handle if platform is ga4
        if (platformParam === 'ga4') {
            if (errorParam) {
                const errorMessage = decodeURIComponent(errorParam);
                console.error('OAuth Error:', errorMessage);
                toast.error(`Connection failed: ${errorMessage}`);

                // Clean URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

            } else if (statusParam === 'select_account' && tempTokenParam) {
                fetchTempProperties(tempTokenParam);
            }
        }
    }, [searchParams, fetchTempProperties]);

    const isConnected = status.googleAnalytics;

    const handleDisconnect = async () => {
        if (confirm('Are you sure you want to disconnect Google Analytics?')) {
            try {
                toast.promise(disconnectGoogleAnalytics(), {
                    loading: 'Disconnecting...',
                    success: 'Disconnected successfully',
                    error: 'Failed to disconnect'
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSync = async () => {
        try {
            await syncGoogleAnalytics();
            toast.success('Sync completed successfully');
            await refetch(); // Refresh status
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to sync analytics data';
            
            if (errorMsg.includes('unauthorized_client')) {
                toast.error('Google Analytics authentication expired. Please disconnect and reconnect your account.');
            } else if (errorMsg.includes('expired') || errorMsg.includes('invalid')) {
                toast.error('Your Google Analytics connection needs to be refreshed. Please reconnect.');
            } else {
                toast.error(errorMsg);
            }
            
            console.error(error);
        }
    };

    return (
        <>
            <DataSourceCard
                name={platform.name}
                description={platform.description}
                icon={platform.icon}
                color={platform.color}
                isConnected={isConnected}
                isConnecting={isConnecting}
                isSyncing={isSyncing}
                onConnect={startGA4Flow}
                onDisconnect={handleDisconnect}
            >
                {isConnected && ga4Account && (
                    <>
                        <div className="mt-4 space-y-3">
                            <div className="text-sm font-medium text-slate-700">Connected Property:</div>
                            <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">
                                                {ga4Account.propertyName || ga4Account.propertyId}
                                            </span>
                                            <span className="text-xs text-slate-500">ID: {ga4Account.propertyId}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${ga4Account.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {ga4Account.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 text-right">
                                Last synced: {ga4Account.lastSyncAt
                                    ? new Date(ga4Account.lastSyncAt).toLocaleString()
                                    : 'Never'}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.location.href = '/seo-web-analytics'}
                            >
                                Open Dashboard
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                    'Sync Now'
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DataSourceCard>

            <PropertySelectionDialog
                isOpen={tempProperties.length > 0 || (isConnecting && !isConnected)}
                isLoading={isConnecting && tempProperties.length === 0}
                properties={tempProperties}
                onSelect={completeConnection}
                onCancel={cancelFlow}
            />
        </>
    );
}
