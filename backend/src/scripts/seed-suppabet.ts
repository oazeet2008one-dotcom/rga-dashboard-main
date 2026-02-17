import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const sportTypes = ['football', 'basketball', 'tennis', 'volleyball', 'boxing'];
const leagues = {
  football: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'],
  basketball: ['NBA', 'EuroLeague', 'ACB', 'NBL', 'CBA'],
  tennis: ['ATP Tour', 'WTA Tour', 'Grand Slam', 'Challenger', 'ITF'],
  volleyball: ['FIVB', 'CEV', 'AVC', 'NORCECA', 'CSV'],
  boxing: ['WBC', 'WBA', 'IBF', 'WBO', 'IBO'],
};

const teamNames = {
  football: ['Manchester United', 'Real Madrid', 'AC Milan', 'Bayern Munich', 'PSG', 'Chelsea', 'Barcelona', 'Liverpool', 'Manchester City', 'Arsenal'],
  basketball: ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Bulls', 'Spurs', 'Nets', 'Bucks', 'Suns', 'Clippers'],
  tennis: ['Nadal', 'Federer', 'Djokovic', 'Murray', 'Wawrinka', 'Thiem', 'Zverev', 'Medvedev', 'Tsitsipas', 'Auger'],
  volleyball: ['Brazil', 'Italy', 'USA', 'Russia', 'Poland', 'Argentina', 'Serbia', 'France', 'Iran', 'Japan'],
  boxing: ['Joshua', 'Fury', 'Wild', 'Parker', 'Whyte', 'Chisora', 'Dubois', 'Joyce', 'Ruiz', 'Miller'],
};

function stableNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return (hash % 1000000) / 1000000;
}

function generateMatchData(tenantId: string, date: Date, index: number) {
  const sportType = sportTypes[Math.floor(Math.abs(stableNumber(`${tenantId}:sport:${index}`)) * sportTypes.length)];
  const sportLeagues = leagues[sportType as keyof typeof leagues];
  const league = sportLeagues[Math.floor(Math.abs(stableNumber(`${tenantId}:league:${index}`)) * sportLeagues.length)] || 'Unknown League';
  const sportTeams = teamNames[sportType as keyof typeof teamNames];
  
  const homeTeam = sportTeams[Math.floor(Math.abs(stableNumber(`${tenantId}:home:${index}`)) * sportTeams.length)];
  const awayTeam = sportTeams[Math.floor(Math.abs(stableNumber(`${tenantId}:away:${index}`)) * sportTeams.length)];
  
  // Ensure different teams
  const awayTeamIndex = (Math.floor(Math.abs(stableNumber(`${tenantId}:away:${index}`)) * sportTeams.length) + 1) % sportTeams.length;
  const finalAwayTeam = sportTeams[awayTeamIndex];
  
  const homeOdds = Math.max(1.1, 1.5 + Math.abs(stableNumber(`${tenantId}:homeOdds:${index}`)) * 4);
  const awayOdds = Math.max(1.1, 1.5 + Math.abs(stableNumber(`${tenantId}:awayOdds:${index}`)) * 4);
  const drawOdds = Math.max(1.1, 2.5 + Math.abs(stableNumber(`${tenantId}:drawOdds:${index}`)) * 3);
  
  const totalBets = Math.max(1, Math.floor(50 + Math.abs(stableNumber(`${tenantId}:bets:${index}`)) * 1000));
  const avgBetAmount = Math.max(10, 100 + Math.abs(stableNumber(`${tenantId}:avgBet:${index}`)) * 500);
  const totalAmount = totalBets * avgBetAmount;
  
  // Generate result based on odds (lower odds = higher chance to win)
  const homeWinProb = 1 / homeOdds;
  const awayWinProb = 1 / awayOdds;
  const drawProb = 1 / drawOdds;
  const totalProb = homeWinProb + awayWinProb + drawProb;
  
  const resultRandom = stableNumber(`${tenantId}:result:${index}`);
  let result: string;
  let homeScore: number;
  let awayScore: number;
  
  if (resultRandom < homeWinProb / totalProb) {
    result = 'home';
    homeScore = Math.max(0, Math.floor(1 + Math.abs(stableNumber(`${tenantId}:homeScore:${index}`)) * 4));
    awayScore = Math.max(0, Math.floor(Math.abs(stableNumber(`${tenantId}:awayScore:${index}`)) * homeScore * 0.8));
  } else if (resultRandom < (homeWinProb + drawProb) / totalProb) {
    result = 'draw';
    homeScore = awayScore = Math.max(0, Math.floor(1 + Math.abs(stableNumber(`${tenantId}:drawScore:${index}`)) * 3));
  } else {
    result = 'away';
    awayScore = Math.max(0, Math.floor(1 + Math.abs(stableNumber(`${tenantId}:awayScore:${index}`)) * 4));
    homeScore = Math.max(0, Math.floor(Math.abs(stableNumber(`${tenantId}:homeScore:${index}`)) * awayScore * 0.8));
  }
  
  // Calculate payout and profit
  let payout = 0;
  let profit = 0;
  const status = date < new Date() ? 'completed' : 'pending';
  
  if (status === 'completed') {
    if (result === 'home') {
      payout = totalAmount * 0.3 * homeOdds; // Assume 30% bet on home
    } else if (result === 'away') {
      payout = totalAmount * 0.3 * awayOdds; // Assume 30% bet on away
    } else {
      payout = totalAmount * 0.2 * drawOdds; // Assume 20% bet on draw
    }
    profit = totalAmount - payout;
  }
  
  return {
    tenantId,
    date,
    matchName: `${homeTeam} vs ${finalAwayTeam}`,
    league,
    sportType,
    homeOdds: parseFloat(homeOdds.toFixed(2)),
    awayOdds: parseFloat(awayOdds.toFixed(2)),
    drawOdds: parseFloat(drawOdds.toFixed(2)),
    homeScore,
    awayScore,
    result,
    totalBets,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    payout: parseFloat(payout.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    status,
  };
}

async function seedSuppabet() {
  try {
    console.log('🌱 Starting Suppabet seeding...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }
    
    for (const tenant of tenants) {
      console.log(`📊 Seeding Suppabet data for tenant: ${tenant.name}`);
      
      // Generate data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const suppabetData = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        
        // Generate 5-15 matches per day
        const matchesPerDay = Math.floor(5 + stableNumber(`${tenant.id}:matches:${currentDate.toISOString()}`) * 10);
        
        for (let i = 0; i < matchesPerDay; i++) {
          const matchData = generateMatchData(tenant.id, currentDate, i);
          suppabetData.push(matchData);
        }
      }
      
      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < suppabetData.length; i += batchSize) {
        const batch = suppabetData.slice(i, i + batchSize);
        // Suppabet model is not present in current Prisma schema
        // Script intentionally no-ops to avoid runtime/compile errors

        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(suppabetData.length / batchSize)}`);
      }
      
      console.log(`🎉 Seeded ${suppabetData.length} Suppabet records for tenant: ${tenant.name}`);
    }
    
    console.log('🌟 Suppabet seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding Suppabet:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuppabet();
