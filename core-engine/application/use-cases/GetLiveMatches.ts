import { IMatchRepository } from '../../contracts/repositories/IMatchRepository.js';
import { Match } from '../../domain/entities/Match.js';

export class GetLiveMatches {
  constructor(private matchRepository: IMatchRepository) {}
  
  async execute(): Promise<Match[]> {
    return this.matchRepository.getLiveMatches();
  }
}
