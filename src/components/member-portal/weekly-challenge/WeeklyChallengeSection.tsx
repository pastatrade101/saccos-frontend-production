import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import { useLanguage } from "../../../ui/LanguageProvider";
import type {
    MyWeeklyChallengeStatus,
    WeeklyChallenge,
    WeeklyChallengeStandings
} from "../../../types/api";

function tzs(value: number | null | undefined) {
    return `TSh ${new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0))}`;
}

function fmtDate(iso: string) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/// A trophy for every participant once the challenge is over — 1st/2nd/3rd
/// get the numbered medal, everyone else who finished gets a plain trophy for
/// having competed. Null before completion.
function trophyFor(status: WeeklyChallenge["status"], rank: number): string | null {
    if (status !== "completed") return null;
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏆";
}

export interface WeeklyChallengeSectionProps {
    challenge: WeeklyChallenge | null;
    myStatus: MyWeeklyChallengeStatus | null;
    standings: WeeklyChallengeStandings | null;
    standingsLoading: boolean;
    registering: boolean;
    onRegister: () => void;
    onWithdraw: () => void;
}

/// The member-facing side of a Weekly Challenge: rules, registration, today's
/// live leaderboard, and the day-by-day grid — the portal's own answer to
/// "wanaona ligi inavyoendelea" alongside the notifications that announce it.
///
/// Deliberately not called a "league" anywhere in the copy: this is a
/// separate, time-boxed competition from the tier-based Savings League shown
/// elsewhere in the portal, and members should never have to guess which one
/// a message refers to.
export function WeeklyChallengeSection({
    challenge,
    myStatus,
    standings,
    standingsLoading,
    registering,
    onRegister,
    onWithdraw
}: WeeklyChallengeSectionProps) {
    const { t } = useLanguage();

    if (!challenge) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        {t("There is no Weekly Challenge running right now.", "Hakuna Changamoto ya Wiki inayoendelea kwa sasa.")}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const registered = Boolean(myStatus?.registered);
    const canRegister = challenge.status === "registration_open";
    const registrationClosed = challenge.status === "active" || challenge.status === "completed" || challenge.status === "cancelled";

    return (
        <Stack spacing={2}>
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <WhatshotRoundedIcon color="warning" />
                            <Typography variant="h6">{challenge.name}</Typography>
                            <Chip
                                size="small"
                                color={challenge.status === "cancelled" ? "error" : challenge.status === "completed" ? "success" : "info"}
                                label={challenge.status.replace(/_/g, " ")}
                            />
                        </Stack>

                        {challenge.description ? (
                            <Typography variant="body2" color="text.secondary">{challenge.description}</Typography>
                        ) : null}

                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`${fmtDate(challenge.start_date)} – ${fmtDate(challenge.end_date)}`} />
                            <Chip size="small" variant="outlined" label={`${t("Min", "Kima")} ${tzs(challenge.minimum_daily_deposit)}/${t("day", "siku")}`} />
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`${challenge.participant_count} ${t("registered", "wamejisajili")} (${t("min", "kima")} ${challenge.minimum_participants})`}
                            />
                        </Stack>

                        <Stack direction="row" spacing={0.75}>
                            <Chip size="small" icon={<EmojiEventsRoundedIcon sx={{ fontSize: 16 }} />} label={`${t("Gold", "Dhahabu")} ${tzs(challenge.gold_reward_amount)}`} />
                            <Chip size="small" label={`${t("Silver", "Fedha")} ${tzs(challenge.silver_reward_amount)}`} />
                            <Chip size="small" label={`${t("Bronze", "Shaba")} ${tzs(challenge.bronze_reward_amount)}`} />
                        </Stack>

                        {challenge.status === "draft" ? (
                            <Alert severity="info" variant="outlined">
                                {t("Registration has not opened yet.", "Usajili haujafunguliwa bado.")}
                            </Alert>
                        ) : null}

                        {challenge.status === "cancelled" ? (
                            <Alert severity="warning" variant="outlined">
                                {t("This challenge did not reach the minimum number of participants and was cancelled.", "Changamoto hii haikufikia idadi ya chini ya washiriki na imesitishwa.")}
                            </Alert>
                        ) : null}

                        {canRegister ? (
                            registered ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip color="success" label={t("You're registered", "Umejisajili")} />
                                    <Button size="small" color="error" disabled={registering} onClick={onWithdraw}>
                                        {t("Withdraw", "Ondoa usajili")}
                                    </Button>
                                </Stack>
                            ) : (
                                <Button variant="contained" disabled={registering} onClick={onRegister} sx={{ alignSelf: "flex-start" }}>
                                    {registering ? t("Registering…", "Inasajili…") : t("Register to compete", "Jisajili kushiriki")}
                                </Button>
                            )
                        ) : registrationClosed && !registered ? (
                            <Alert severity="info" variant="outlined">
                                {t("Registration is closed for this challenge.", "Usajili umefungwa kwa changamoto hii.")}
                            </Alert>
                        ) : null}
                    </Stack>
                </CardContent>
            </Card>

            {registered && myStatus ? (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>{t("My status", "Hali yangu")}</Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={`${t("Days won", "Siku ulizoshinda")}: ${myStatus.days_won ?? 0}`} />
                            {myStatus.rank ? <Chip size="small" label={`${t("Rank", "Nafasi")} #${myStatus.rank}`} /> : null}
                            <Chip
                                size="small"
                                color={myStatus.eliminated ? "error" : "success"}
                                variant="outlined"
                                label={myStatus.eliminated ? t("Eliminated", "Umeondolewa") : t("Still in it", "Bado unaendelea")}
                            />
                        </Stack>
                        {challenge.status === "active" && !myStatus.eliminated ? (
                            myStatus.today_qualified ? (
                                <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
                                    {t("Today's deposit is in.", "Amana ya leo imeingia.")} {tzs(myStatus.today_deposited)}
                                </Alert>
                            ) : (
                                <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
                                    {t("You still need to deposit", "Bado unahitaji kuweka")} {tzs(myStatus.still_owed_today)} {t("today to stay in the competition.", "leo ili uendelee kushiriki.")}
                                </Alert>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}

            {standings?.today_leaderboard?.length ? (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>{t("Today's leaderboard", "Ubao wa leo")}</Typography>
                        <Stack spacing={0.75}>
                            {standings.today_leaderboard.slice(0, 10).map((row) => (
                                <Stack key={row.member_id} direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2">
                                        {row.rank}. {row.full_name || row.member_no}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>{tzs(row.deposited_amount)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            ) : null}

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>{t("Standings", "Matokeo")}</Typography>
                    {standingsLoading ? (
                        <Typography variant="body2" color="text.secondary">{t("Loading…", "Inapakia…")}</Typography>
                    ) : !standings || !standings.rows.length ? (
                        <Typography variant="body2" color="text.secondary">
                            {t("No one has registered yet.", "Hakuna aliyejisajili bado.")}
                        </Typography>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>{t("Member", "Mwanachama")}</TableCell>
                                        {standings.days.map((day) => (
                                            <TableCell key={day.date} align="center">{fmtDate(day.date)}</TableCell>
                                        ))}
                                        <TableCell align="right">{t("Won", "Alishinda")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {standings.rows.map((row) => (
                                        <TableRow key={row.member_id} hover>
                                            <TableCell>
                                                {row.rank}
                                                {trophyFor(challenge.status, row.rank) ? ` ${trophyFor(challenge.status, row.rank)}` : ""}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{row.full_name}</Typography>
                                                {row.eliminated ? (
                                                    <Typography variant="caption" color="error.main">{t("eliminated", "ameondolewa")}</Typography>
                                                ) : null}
                                            </TableCell>
                                            {row.daily_status.map((cell) => (
                                                <TableCell key={cell.date} align="center">
                                                    {cell.deposited_amount > 0 || cell.date < new Date().toISOString().slice(0, 10)
                                                        ? (cell.qualified ? "✅" : "❌")
                                                        : "—"}
                                                </TableCell>
                                            ))}
                                            <TableCell align="right">{row.days_won}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
