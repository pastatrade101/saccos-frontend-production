import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { api, getApiErrorMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import type { MemberHeirsSummary } from "../../types/api";
import { formatDate } from "../../utils/format";
import { NEXT_OF_KIN_RELATIONSHIP_OPTIONS, formatNextOfKinRelationship } from "../../utils/nextOfKin";
import { useTanzaniaLocations } from "../../hooks/useTanzaniaLocations";
import { SearchableSelect } from "../SearchableSelect";

const MAX_HEIRS = 10;

const optionalTrimmed = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""));

const heirFieldSchema = z.object({
    full_name: z.string().trim().min(3, "Full name is required (at least 3 characters).").max(120),
    dob: z
        .string()
        .min(1, "Date of birth is required.")
        .refine((value) => new Date(`${value}T00:00:00`) < new Date(), "Date of birth must be in the past."),
    gender: z.enum(["male", "female", "other"], { message: "Select a gender." }),
    relationship: z.string().trim().min(2, "Select a relationship.").max(80),
    phone: optionalTrimmed,
    email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
    // Structured address, same format as the member's own: dropdown hierarchy
    // + manual street detail. Complete-when-started, like the profile form.
    region_id: z.string().uuid().optional().or(z.literal("")),
    district_id: z.string().uuid().optional().or(z.literal("")),
    ward_id: z.string().uuid().optional().or(z.literal("")),
    village_id: z.string().uuid().optional().or(z.literal("")),
    street: optionalTrimmed,
    wealth_percent: z.coerce
        .number({ message: "Enter the percentage of wealth." })
        .min(0, "Percentage cannot be negative.")
        .max(100, "Percentage cannot exceed 100.")
}).superRefine((value, ctx) => {
    const present = [value.region_id, value.district_id, value.ward_id]
        .filter((entry) => String(entry || "").trim() !== "").length;
    if (present > 0 && present < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["region_id"], message: "Select region, district, and ward together." });
    }
    if (String(value.village_id || "").trim() !== "" && present < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["village_id"], message: "Select region, district, and ward before the village." });
    }
});

const heirsFormSchema = z
    .object({
        heirs: z.array(heirFieldSchema).max(MAX_HEIRS, `You can nominate at most ${MAX_HEIRS} heirs.`)
    })
    .superRefine((value, ctx) => {
        const total = value.heirs.reduce((sum, heir) => sum + Number(heir.wealth_percent || 0), 0);
        if (Number(total.toFixed(2)) > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Wealth allocation totals ${total.toFixed(2)}% — it cannot exceed 100%.`,
                path: ["heirs"]
            });
        }
    });

type HeirsFormValues = z.infer<typeof heirsFormSchema>;

const EMPTY_HEIR: HeirsFormValues["heirs"][number] = {
    full_name: "",
    dob: "",
    gender: "" as HeirsFormValues["heirs"][number]["gender"],
    relationship: "",
    phone: "",
    email: "",
    region_id: "",
    district_id: "",
    ward_id: "",
    village_id: "",
    street: "",
    wealth_percent: 0
};

// Structured address cascade for one heir row. Extracted so each row gets its
// own useTanzaniaLocations instance (hooks cannot run inside the fields loop).
function HeirAddressFields({ form, index }: { form: UseFormReturn<HeirsFormValues>; index: number }) {
    const regionId = form.watch(`heirs.${index}.region_id`);
    const districtId = form.watch(`heirs.${index}.district_id`);
    const wardId = form.watch(`heirs.${index}.ward_id`);
    const {
        regionOptions,
        districtOptions,
        wardOptions,
        villageOptions,
        loadingRegions,
        loadingDistricts,
        loadingWards,
        loadingVillages
    } = useTanzaniaLocations({ regionId, districtId, wardId });

    const rowErrors = form.formState.errors.heirs?.[index];
    const fieldError = (name: "region_id" | "district_id" | "ward_id" | "village_id" | "street") => {
        const error = rowErrors?.[name];
        return { error: Boolean(error), helperText: error?.message as string | undefined };
    };

    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                    value={regionId || ""}
                    options={regionOptions}
                    label="Region"
                    loading={loadingRegions}
                    placeholder={loadingRegions ? "Loading regions..." : "Search region..."}
                    {...fieldError("region_id")}
                    onChange={(value) => {
                        form.setValue(`heirs.${index}.region_id`, value, { shouldValidate: true });
                        form.setValue(`heirs.${index}.district_id`, "", { shouldValidate: false });
                        form.setValue(`heirs.${index}.ward_id`, "", { shouldValidate: false });
                        form.setValue(`heirs.${index}.village_id`, "", { shouldValidate: false });
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                    value={districtId || ""}
                    options={districtOptions}
                    label="District"
                    disabled={!regionId}
                    loading={loadingDistricts}
                    placeholder={regionId ? (loadingDistricts ? "Loading districts..." : "Search district...") : "Select a region first"}
                    {...fieldError("district_id")}
                    onChange={(value) => {
                        form.setValue(`heirs.${index}.district_id`, value, { shouldValidate: true });
                        form.setValue(`heirs.${index}.ward_id`, "", { shouldValidate: false });
                        form.setValue(`heirs.${index}.village_id`, "", { shouldValidate: false });
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                    value={wardId || ""}
                    options={wardOptions}
                    label="Ward"
                    disabled={!districtId}
                    loading={loadingWards}
                    placeholder={districtId ? (loadingWards ? "Loading wards..." : "Search ward...") : "Select a district first"}
                    {...fieldError("ward_id")}
                    onChange={(value) => {
                        form.setValue(`heirs.${index}.ward_id`, value, { shouldValidate: true });
                        form.setValue(`heirs.${index}.village_id`, "", { shouldValidate: false });
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <SearchableSelect
                    value={form.watch(`heirs.${index}.village_id`) || ""}
                    options={villageOptions}
                    label="Village / Mtaa"
                    disabled={!wardId}
                    loading={loadingVillages}
                    placeholder={wardId ? (loadingVillages ? "Loading villages..." : "Search village or mtaa...") : "Select a ward first"}
                    {...fieldError("village_id")}
                    onChange={(value) => {
                        form.setValue(`heirs.${index}.village_id`, value, { shouldValidate: true });
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Street / unique detail (optional)"
                    {...form.register(`heirs.${index}.street`)}
                    {...fieldError("street")}
                />
            </Grid>
        </>
    );
}

interface HeirsSectionProps {
    memberStatus?: string | null;
    /** Staff mode: manage the given member's heirs instead of the signed-in member's own. */
    memberId?: string;
    /** Staff mode only: whether the current role may edit (backend allows super_admin / branch_manager). */
    canEdit?: boolean;
}

export function HeirsSection({ memberStatus, memberId, canEdit = true }: HeirsSectionProps) {
    const [summary, setSummary] = useState<MemberHeirsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    const staffMode = Boolean(memberId);
    const heirsUrl = memberId ? endpoints.memberHeirs.member(memberId) : endpoints.memberHeirs.me();
    // Members lose edit access once the membership is closed; staff keep it so
    // records stay correctable during estate settlement.
    const editingLocked = staffMode ? !canEdit : memberStatus === "exited";

    const form = useForm<HeirsFormValues>({
        resolver: zodResolver(heirsFormSchema),
        defaultValues: { heirs: [] }
    });
    const heirArray = useFieldArray({ control: form.control, name: "heirs" });

    const loadHeirs = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await api.get<{ data: MemberHeirsSummary }>(heirsUrl);
            setSummary(response.data.data);
        } catch (error) {
            setLoadError(getApiErrorMessage(error, "Unable to load the heirs."));
        } finally {
            setLoading(false);
        }
    }, [heirsUrl]);

    useEffect(() => {
        void loadHeirs();
    }, [loadHeirs]);

    const openDialog = () => {
        setSaveError(null);
        form.reset({
            heirs: (summary?.heirs || []).map((heir) => ({
                full_name: heir.full_name,
                dob: heir.dob || "",
                gender: (heir.gender || "") as HeirsFormValues["heirs"][number]["gender"],
                relationship: heir.relationship,
                phone: heir.phone || "",
                email: heir.email || "",
                region_id: heir.region_id || "",
                district_id: heir.district_id || "",
                ward_id: heir.ward_id || "",
                village_id: heir.village_id || "",
                // Legacy heirs only have free-text address — surface it in the
                // street box so it is not lost when re-saving.
                street: heir.street || (heir.region_id ? "" : heir.address) || "",
                wealth_percent: Number(heir.wealth_percent || 0)
            }))
        });
        setDialogOpen(true);
    };

    const submit = form.handleSubmit(async (values) => {
        setSaving(true);
        setSaveError(null);
        try {
            const payload = {
                heirs: values.heirs.map((heir) => ({
                    full_name: heir.full_name,
                    dob: heir.dob,
                    gender: heir.gender,
                    relationship: heir.relationship,
                    phone: heir.phone || null,
                    email: heir.email || null,
                    // The backend composes the display address from the hierarchy
                    // (or falls back to the street text) — never sent from here.
                    region_id: heir.region_id || null,
                    district_id: heir.district_id || null,
                    ward_id: heir.ward_id || null,
                    village_id: heir.village_id || null,
                    street: heir.street || null,
                    wealth_percent: Number(heir.wealth_percent || 0)
                }))
            };
            const response = await api.put<{ data: MemberHeirsSummary }>(heirsUrl, payload);
            setSummary(response.data.data);
            setDialogOpen(false);
            setSavedAt(Date.now());
        } catch (error) {
            setSaveError(getApiErrorMessage(error, "Unable to save your heirs."));
        } finally {
            setSaving(false);
        }
    });

    const heirs = summary?.heirs || [];
    const totalPercent = summary?.total_wealth_percent ?? 0;
    const watchedHeirs = form.watch("heirs");
    const draftTotal = (watchedHeirs || []).reduce((sum, heir) => sum + Number(heir?.wealth_percent || 0), 0);
    const heirsArrayError = form.formState.errors.heirs?.root?.message || form.formState.errors.heirs?.message;

    return (
        <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="overline" color="text.secondary">Heirs (Warithi) — up to {MAX_HEIRS}</Typography>
                <Button
                    size="small"
                    startIcon={heirs.length ? <EditRoundedIcon /> : <AddRoundedIcon />}
                    onClick={openDialog}
                    disabled={loading || editingLocked}
                >
                    {heirs.length ? "Manage heirs" : "Add heirs"}
                </Button>
            </Stack>

            {editingLocked ? (
                <Alert severity="info">
                    {staffMode
                        ? "Your role can review the heirs on record but cannot change them."
                        : "This membership has been closed, so the heirs on record can no longer be changed from the portal."}
                </Alert>
            ) : null}
            {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
            {savedAt ? <Alert severity="success" onClose={() => setSavedAt(null)}>{staffMode ? "The member's heirs have been updated." : "Your heirs have been updated."}</Alert> : null}

            {loading ? (
                <Box display="flex" justifyContent="center" py={2}><CircularProgress size={22} /></Box>
            ) : heirs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    {staffMode
                        ? `This member has not nominated any heirs yet. Nominating heirs is optional — up to ${MAX_HEIRS} people with a percentage of wealth allocated to each.`
                        : `You have not nominated any heirs yet. Nominating heirs is optional — you can add up to ${MAX_HEIRS} people and state the percentage of your wealth allocated to each.`}
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {heirs.map((heir, index) => (
                        <Box key={heir.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                <Typography variant="subtitle2">{index + 1}. {heir.full_name}</Typography>
                                <Chip size="small" color="primary" variant="outlined" label={`${Number(heir.wealth_percent).toFixed(2).replace(/\.00$/, "")}% of wealth`} />
                            </Stack>
                            <Grid container spacing={1} mt={0.25}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatNextOfKinRelationship(heir.relationship)}
                                        {heir.gender ? ` · ${heir.gender.charAt(0).toUpperCase()}${heir.gender.slice(1)}` : ""}
                                        {heir.dob ? ` · Born ${formatDate(heir.dob)}` : ""}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {[heir.phone, heir.email, heir.address].filter(Boolean).join(" · ") || "No contact details"}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Stack spacing={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Total wealth allocated</Typography>
                            <Typography variant="caption" fontWeight={600}>{totalPercent}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={Math.min(totalPercent, 100)} sx={{ borderRadius: 1, height: 6 }} />
                    </Stack>
                </Stack>
            )}

            <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Manage heirs (Warithi)</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {staffMode
                                ? `Nominate up to ${MAX_HEIRS} heirs on the member's behalf and state the percentage of wealth allocated to each. The combined allocation cannot exceed 100%.`
                                : `Nominate up to ${MAX_HEIRS} heirs and state the percentage of your wealth allocated to each. The combined allocation cannot exceed 100%. You can change this list at any time.`}
                        </Typography>
                        {saveError ? <Alert severity="error">{saveError}</Alert> : null}
                        {heirsArrayError ? <Alert severity="warning">{heirsArrayError}</Alert> : null}

                        {heirArray.fields.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No heirs on the list. Use "Add heir" below to nominate one.</Typography>
                        ) : null}

                        {heirArray.fields.map((field, index) => {
                            const fieldError = (name: keyof HeirsFormValues["heirs"][number]) => {
                                const error = form.formState.errors.heirs?.[index]?.[name];
                                return { error: Boolean(error), helperText: error?.message as string | undefined };
                            };

                            return (
                                <Box key={field.id} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                                        <Typography variant="subtitle2">Heir {index + 1}</Typography>
                                        <IconButton size="small" color="error" aria-label={`Remove heir ${index + 1}`} onClick={() => heirArray.remove(index)}>
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                    <Grid container spacing={1.5}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField fullWidth label="Full name" {...form.register(`heirs.${index}.full_name`)} {...fieldError("full_name")} />
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Date of birth"
                                                InputLabelProps={{ shrink: true }}
                                                {...form.register(`heirs.${index}.dob`)}
                                                {...fieldError("dob")}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Gender"
                                                value={form.watch(`heirs.${index}.gender`) || ""}
                                                onChange={(event) => form.setValue(`heirs.${index}.gender`, event.target.value as HeirsFormValues["heirs"][number]["gender"], { shouldValidate: true })}
                                                {...fieldError("gender")}
                                            >
                                                <MenuItem value="male">Male</MenuItem>
                                                <MenuItem value="female">Female</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Relationship"
                                                value={form.watch(`heirs.${index}.relationship`) || ""}
                                                onChange={(event) => form.setValue(`heirs.${index}.relationship`, event.target.value, { shouldValidate: true })}
                                                {...fieldError("relationship")}
                                            >
                                                {NEXT_OF_KIN_RELATIONSHIP_OPTIONS.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Wealth allocated (%)"
                                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                                {...form.register(`heirs.${index}.wealth_percent`)}
                                                {...fieldError("wealth_percent")}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField fullWidth label="Phone (optional)" {...form.register(`heirs.${index}.phone`)} {...fieldError("phone")} />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField fullWidth label="Email (optional)" {...form.register(`heirs.${index}.email`)} {...fieldError("email")} />
                                        </Grid>
                                        <HeirAddressFields form={form} index={index} />
                                    </Grid>
                                </Box>
                            );
                        })}

                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Button
                                startIcon={<AddRoundedIcon />}
                                onClick={() => heirArray.append({ ...EMPTY_HEIR })}
                                disabled={heirArray.fields.length >= MAX_HEIRS}
                            >
                                Add heir ({heirArray.fields.length}/{MAX_HEIRS})
                            </Button>
                            <Typography variant="body2" color={draftTotal > 100 ? "error.main" : "text.secondary"} fontWeight={600}>
                                Allocated: {draftTotal.toFixed(2).replace(/\.00$/, "")}%
                            </Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, py: 1.5 }}>
                    <Button color="inherit" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={submit} disabled={saving}>
                        {saving ? "Saving…" : "Save heirs"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}