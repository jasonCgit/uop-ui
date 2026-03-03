import { Card, CardContent, Typography, Box, IconButton, Button, ButtonGroup, Chip, Tooltip } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RefreshIcon from '@mui/icons-material/Refresh'
import EmailIcon from '@mui/icons-material/Email'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'

const fSmall = { fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }

const TIME_PERIODS = [1, 5, 7, 14, 30]

export default function SituationHeader({
  situation, currentIndex, totalCount, timePeriod,
  onPrev, onNext, onTimePeriodChange, onRefresh, onExport, onNewSituation,
}) {
  if (!situation) return null
  const incNum = situation.incident_number

  return (
    <Card sx={{
      mb: 1.5,
      background: 'linear-gradient(135deg, rgba(244,67,54,0.10), rgba(251,146,60,0.05))',
      border: '1px solid rgba(244,67,54,0.20)',
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Row 1: Title + Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', fontWeight: 700, color: '#f44336' }}>
              {situation.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Previous Incident" arrow>
              <span>
                <IconButton size="small" onClick={onPrev} disabled={currentIndex <= 0}>
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography sx={{ ...fSmall, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              Incident {currentIndex + 1} of {totalCount}
            </Typography>
            <Tooltip title="Next Incident" arrow>
              <span>
                <IconButton size="small" onClick={onNext} disabled={currentIndex >= totalCount - 1}>
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Row 2: Metadata + Time period + Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {incNum && (
              <Chip
                label={incNum}
                size="small"
                component="a"
                href={`https://jpmc.service-now.com/nav_to.do?uri=incident.do?sysparm_query=number=${incNum}`}
                target="_blank"
                clickable
                icon={<LinkIcon sx={{ fontSize: 13 }} />}
                sx={{ ...fSmall, height: 22, fontWeight: 600 }}
                color="error"
                variant="outlined"
              />
            )}
            <Chip label={situation.priority} size="small" color="error" sx={{ ...fSmall, height: 22, fontWeight: 700 }} />
            <Chip label={`State: ${situation.state}`} size="small" variant="outlined" sx={{ ...fSmall, height: 22 }} />
            {situation.opened_time && (
              <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
                Opened: {situation.opened_time}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <ButtonGroup size="small" sx={{ mr: 0.5 }}>
              {TIME_PERIODS.map(d => (
                <Button
                  key={d}
                  variant={timePeriod === d ? 'contained' : 'outlined'}
                  onClick={() => onTimePeriodChange(d)}
                  sx={{ ...fSmall, py: 0.3, px: 0.8, minWidth: 0 }}
                >
                  {d}d
                </Button>
              ))}
            </ButtonGroup>
            <Tooltip title="Refresh" arrow>
              <IconButton size="small" onClick={onRefresh}><RefreshIcon sx={{ fontSize: 18 }} /></IconButton>
            </Tooltip>
            <Tooltip title="Export Report" arrow>
              <IconButton size="small" onClick={onExport}><DownloadIcon sx={{ fontSize: 18 }} /></IconButton>
            </Tooltip>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={onNewSituation}
              sx={{ ...fSmall, textTransform: 'none', py: 0.3 }}>
              New
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
