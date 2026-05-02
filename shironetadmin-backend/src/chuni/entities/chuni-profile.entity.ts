// src/chuni/entities/chuni-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AimeUser } from '../../user/entities/aime-user.entity';

@Entity('chuni_profile_data')
export class ChuniProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user' })
  userId: number;

  @Column()
  version: number;

  @Column({ nullable: true })
  exp: number;

  @Column({ nullable: true })
  level: number;

  @Column({ nullable: true })
  point: number;

  @Column({ nullable: true })
  frameId: number;

  @Column({ nullable: true, type: 'tinyint' })
  isMaimai: boolean;

  @Column({ nullable: true })
  trophyId: number;

  @Column({ nullable: true })
  trophyIdSub1: number;

  @Column({ nullable: true })
  trophyIdSub2: number;

  @Column({ nullable: true, length: 25 })
  userName: string;

  @Column({ nullable: true, type: 'tinyint' })
  isWebJoin: boolean;

  @Column({ nullable: true })
  playCount: number;

  @Column({ nullable: true, length: 25 })
  lastGameId: string;

  @Column({ nullable: true, type: 'bigint' })
  totalPoint: number;

  @Column({ nullable: true })
  characterId: number;

  @Column({ nullable: true, length: 25 })
  firstGameId: string;

  @Column({ nullable: true })
  friendCount: number;

  @Column({ nullable: true })
  lastPlaceId: number;

  @Column({ nullable: true })
  nameplateId: number;

  @Column({ nullable: true })
  totalMapNum: number;

  @Column({ nullable: true })
  lastAllNetId: number;

  @Column({ nullable: true, length: 25 })
  lastClientId: string;

  @Column({ nullable: true, length: 25 })
  lastPlayDate: string;

  @Column({ nullable: true })
  lastRegionId: number;

  @Column({ nullable: true })
  playerRating: number;

  @Column({ nullable: true, type: 'bigint' })
  totalHiScore: number;

  @Column({ nullable: true, length: 25 })
  webLimitDate: string;

  @Column({ nullable: true, length: 25 })
  firstPlayDate: string;

  @Column({ nullable: true })
  highestRating: number;

  @Column({ nullable: true, length: 25 })
  lastPlaceName: string;

  @Column({ nullable: true })
  multiWinCount: number;

  @Column({ nullable: true })
  acceptResCount: number;

  @Column({ nullable: true, length: 25 })
  lastRegionName: string;

  @Column({ nullable: true, length: 25 })
  lastRomVersion: string;

  @Column({ nullable: true })
  multiPlayCount: number;

  @Column({ nullable: true, length: 25 })
  firstRomVersion: string;

  @Column({ nullable: true, length: 25 })
  lastDataVersion: string;

  @Column({ nullable: true })
  requestResCount: number;

  @Column({ nullable: true })
  successResCount: number;

  @Column({ nullable: true, length: 25 })
  eventWatchedDate: string;

  @Column({ nullable: true, length: 25 })
  firstDataVersion: string;

  @Column({ nullable: true })
  reincarnationNum: number;

  @Column({ nullable: true })
  playedTutorialBit: number;

  @Column({ nullable: true })
  totalBasicHighScore: number;

  @Column({ nullable: true })
  totalExpertHighScore: number;

  @Column({ nullable: true })
  totalMasterHighScore: number;

  @Column({ nullable: true })
  totalRepertoireCount: number;

  @Column({ nullable: true })
  firstTutorialCancelNum: number;

  @Column({ nullable: true })
  totalAdvancedHighScore: number;

  @Column({ nullable: true })
  masterTutorialCancelNum: number;

  @Column({ nullable: true })
  mapIconId: number;

  @Column({ nullable: true, length: 25 })
  compatibleCmVersion: string;

  @Column({ nullable: true })
  medal: number;

  @Column({ nullable: true })
  voiceId: number;

  @Column({ nullable: true })
  stageId: number;

  @Column({ nullable: true })
  teamId: number;

  @Column({ default: 0 })
  eliteRankPoint: number;

  @Column({ default: 0 })
  stockedGridCount: number;

  @Column({ default: 0 })
  netBattleLoseCount: number;

  @Column({ default: 0 })
  netBattleHostErrCnt: number;

  @Column({ default: 0 })
  netBattle4thCount: number;

  @Column({ default: 0 })
  overPowerRate: number;

  @Column({ default: 0 })
  battleRewardStatus: number;

  @Column({ default: 0 })
  netBattle1stCount: number;

  @Column({ default: 0 })
  charaIllustId: number;

  @Column({ default: '', length: 8 })
  userNameEx: string;

  @Column({ default: 0 })
  netBattleWinCount: number;

  @Column({ default: 0 })
  netBattleCorrection: number;

  @Column({ default: 0 })
  classEmblemMedal: number;

  @Column({ default: 0 })
  overPowerPoint: number;

  @Column({ default: 0 })
  netBattleErrCnt: number;

  @Column({ default: 0 })
  battleRankId: number;

  @Column({ default: 0 })
  netBattle3rdCount: number;

  @Column({ default: 0 })
  netBattleConsecutiveWinCount: number;

  @Column({ default: 0 })
  overPowerLowerRank: number;

  @Column({ default: 0 })
  classEmblemBase: number;

  @Column({ default: 0 })
  battleRankPoint: number;

  @Column({ default: 0 })
  netBattle2ndCount: number;

  @Column({ default: 0 })
  totalUltimaHighScore: number;

  @Column({ default: 0 })
  skillId: number;

  @Column({ default: 'JPN', length: 5 })
  lastCountryCode: string;

  @Column({ default: 0, type: 'tinyint' })
  isNetBattleHost: boolean;

  @Column({ default: 0 })
  battleRewardCount: number;

  @Column({ default: 0 })
  battleRewardIndex: number;

  @Column({ default: 0 })
  netBattlePlayCount: number;

  @Column({ default: 0 })
  exMapLoopCount: number;

  @Column({ default: 0 })
  netBattleEndState: number;

  @Column({ type: 'longtext', nullable: true })
  rankUpChallengeResults: string;

  @Column({ default: 0 })
  avatarBack: number;

  @Column({ default: 0 })
  avatarFace: number;

  @Column({ default: 0 })
  avatarPoint: number;

  @Column({ default: 0 })
  avatarItem: number;

  @Column({ default: 0 })
  avatarWear: number;

  @Column({ default: 0 })
  avatarFront: number;

  @Column({ default: 0 })
  avatarSkin: number;

  @Column({ default: 0 })
  avatarHead: number;

  @Column({ nullable: true })
  friend_code_id: number;

  @ManyToOne(() => AimeUser)
  @JoinColumn({ name: 'user' })
  user: AimeUser;
}
