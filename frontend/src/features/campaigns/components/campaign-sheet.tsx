import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { LayoutDashboard, Globe, Smartphone, MessageCircle, Target, Calendar as CalendarLucide, X, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetClose,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

import {
    createCampaignSchema,
    CreateCampaignFormData,
    defaultCampaignValues,
} from '../types/schema';
import { useCreateCampaign, useUpdateCampaign } from '../hooks/use-campaign-mutations';
import type { Campaign } from '../types';

// =============================================================================
// Props Interface
// =============================================================================
interface CampaignSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaign?: Campaign | null;
}

// =============================================================================
// Helper: Convert Campaign to Form Data
// =============================================================================
function campaignToFormData(campaign: Campaign): CreateCampaignFormData {
    return {
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        budget: campaign.budget,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
    };
}

// =============================================================================
// Animation Variants
// =============================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// =============================================================================
// Campaign Sheet Component
// =============================================================================
export function CampaignSheet({
    open,
    onOpenChange,
    campaign,
}: CampaignSheetProps) {
    const isEditMode = Boolean(campaign?.id);
    const campaignId = campaign?.id;
    const [resetKey, setResetKey] = useState(0);
    const originalFormDataRef = useRef<Partial<CreateCampaignFormData>>(defaultCampaignValues);
    const hasInitialized = useRef(false);

    const form = useForm<CreateCampaignFormData>({
        resolver: zodResolver(createCampaignSchema),
        defaultValues: defaultCampaignValues,
    });

    const createMutation = useCreateCampaign({
        onSuccess: () => onOpenChange(false),
    });

    const updateMutation = useUpdateCampaign({
        onSuccess: () => onOpenChange(false),
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (!open) {
            hasInitialized.current = false;
            return;
        }
        if (hasInitialized.current) {
            return;
        }
        const formData = campaign
            ? campaignToFormData(campaign)
            : defaultCampaignValues;
        originalFormDataRef.current = { ...formData };
        form.reset(formData);
        setResetKey(0);
        hasInitialized.current = true;
    }, [open, campaign, form]);

    const onSubmit = (values: CreateCampaignFormData) => {
        // Auto-set status to 'completed' if endDate is in the past
        const submissionValues = { ...values };
        if (submissionValues.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(submissionValues.endDate);
            endDate.setHours(0, 0, 0, 0);
            if (endDate < today) {
                submissionValues.status = 'completed';
            }
        }

        if (isEditMode && campaignId) {
            updateMutation.mutate({ id: campaignId, data: submissionValues });
        } else {
            createMutation.mutate(submissionValues);
        }
    };

    const sheetTitle = isEditMode ? 'Edit Campaign' : 'Create Campaign';
    const sheetDescription = isEditMode
        ? 'Update the campaign details below to optimize performance.'
        : 'Launch a new high-performing ad campaign in seconds.';

    const submitButtonText = useMemo(() => {
        if (isPending) return isEditMode ? 'Saving...' : 'Creating...';
        return isEditMode ? 'Save Changes' : 'Create Campaign';
    }, [isPending, isEditMode]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0 gap-0 border-l border-orange-100 [&>button:first-child]:hidden">
                {/* Decorative Header Background */}
                <div className="pt-12 pb-6 px-6 bg-gradient-to-r from-orange-500 to-amber-500 relative overflow-hidden">
                    {/* Custom Close Button */}
                    <SheetClose asChild>
                        <button
                            className="absolute right-4 top-4 z-20 group rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/15 active:scale-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-0"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </SheetClose>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target className="w-32 h-32 text-white transform translate-x-10 -translate-y-10" />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        <SheetHeader className="relative z-10 text-left">
                            <SheetTitle className="text-2xl font-bold text-white tracking-tight">
                                {sheetTitle}
                            </SheetTitle>
                            <SheetDescription className="text-orange-50 opacity-90">
                                {sheetDescription}
                            </SheetDescription>
                        </SheetHeader>
                    </motion.div>
                </div>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <motion.div
                                key={resetKey}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-5"
                            >
                                {/* Campaign Name */}
                                <motion.div variants={itemVariants}>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">Campaign Name</FormLabel>
                                                <div className="relative">
                                                    <LayoutDashboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., Summer Sale 2026"
                                                            className="pl-9 border-slate-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 transition-all shadow-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Platform Select */}
                                    <motion.div variants={itemVariants}>
                                        <FormField
                                            control={form.control}
                                            name="platform"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-700 font-semibold">Platform</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="border-slate-200 focus:ring-orange-500 transition-all shadow-sm">
                                                                <SelectValue placeholder="Select platform" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="google"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Google Ads</div></SelectItem>
                                                            <SelectItem value="facebook"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600" /> Facebook</div></SelectItem>
                                                            <SelectItem value="tiktok"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-pink-500" /> TikTok</div></SelectItem>
                                                            <SelectItem value="line"><div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-500" /> Line Ads</div></SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>

                                    {/* Status Select */}
                                    <motion.div variants={itemVariants}>
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-700 font-semibold">Status</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="border-slate-200 focus:ring-orange-500 transition-all shadow-sm">
                                                                <SelectValue placeholder="Status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="completed"><span className="text-gray-600 font-medium">Completed</span></SelectItem>
                                                            <SelectItem value="active"><span className="text-emerald-600 font-medium">Active</span></SelectItem>
                                                            <SelectItem value="paused"><span className="text-orange-600 font-medium">Paused</span></SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>
                                </div>

                                {/* Budget Input */}
                                <motion.div variants={itemVariants}>
                                    <FormField
                                        control={form.control}
                                        name="budget"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">Budget Limit (THB)</FormLabel>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10">
                                                        ฿
                                                    </span>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="50,000"
                                                            className="pl-8 border-slate-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 transition-all shadow-sm font-mono"
                                                            {...field}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormDescription className="text-xs text-slate-400">
                                                    Monthly spending limit for this campaign.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Start Date */}
                                    <motion.div variants={itemVariants}>
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-slate-700 font-semibold">Start Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'w-full pl-3 text-left font-normal border-slate-200 focus:ring-orange-500 shadow-sm',
                                                                        !field.value && 'text-muted-foreground'
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Pick date</span>
                                                                    )}
                                                                    <CalendarLucide className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) => date < new Date('2020-01-01')}
                                                                initialFocus
                                                                className="rounded-md border shadow-lg"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>

                                    {/* End Date */}
                                    <motion.div variants={itemVariants}>
                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-slate-700 font-semibold">End Date <span className="text-slate-400 font-normal text-xs">(Optional)</span></FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'w-full pl-3 text-left font-normal border-slate-200 focus:ring-orange-500 shadow-sm',
                                                                        !field.value && 'text-muted-foreground'
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Pick date</span>
                                                                    )}
                                                                    <CalendarLucide className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date < new Date('2020-01-01') ||
                                                                    (form.getValues('startDate') &&
                                                                        date <= form.getValues('startDate'))
                                                                }
                                                                initialFocus
                                                                className="rounded-md border shadow-lg"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>

                            <SheetFooter className="pt-6 border-t border-slate-100 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="hover:bg-slate-100 hover:text-slate-900"
                                >
                                    Cancel
                                </Button>
                                <div className="flex-1" />
                                {isEditMode && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const origName = originalFormDataRef.current.name;
                                            const beforeName = form.getValues('name');

                                            form.reset(originalFormDataRef.current);

                                            const afterName = form.getValues('name');

                                            alert(
                                                `ref.name = "${origName}"\n` +
                                                `before reset = "${beforeName}"\n` +
                                                `after reset = "${afterName}"\n` +
                                                `hasInit = ${hasInitialized.current}`
                                            );

                                            setResetKey(k => k + 1);
                                        }}
                                        className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                    {submitButtonText}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet >
    );
}

export { CampaignSheet as CreateCampaignSheet };
