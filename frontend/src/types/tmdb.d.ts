// export interface Episode {
//   air_date: string;
//   episode_number: number;
//   episode_type: string;
//   id: number;
//   name: string;
//   overview: string;
//   production_code: string;
//   runtime: number;
//   season_number: number;
//   show_id: number;
//   still_path: string | null;
//   vote_average: number;
//   vote_count: number;
//   crew: CrewMember[];

//   show_details?: ShowDetails;
// }


// export interface CrewMember {
//   job: string;
//   department: string;
//   credit_id: string;
//   adult: boolean;
//   gender: number;
//   id: number;
//   known_for_department: string;
//   name: string;
//   original_name: string;
//   popularity: number;
//   profile_path: string | null;
// }

// export interface Network {
//   id: number;
//   logo_path: string | null;
//   name: string;
//   origin_country: string;
// }

// export interface Genre {
//   id: number;
//   name: string;
// }

// export interface ProductionCompany {
//   id: number;
//   logo_path: string | null;
//   name: string;
//   origin_country: string;
// }

// export interface ProductionCountry {
//   iso_3166_1: string;
//   name: string;
// }

// export interface SpokenLanguage {
//   english_name: string;
//   iso_639_1: string;
//   name: string;
// }

// export interface SeasonSummary {
//   air_date: string | null;
//   episode_count: number;
//   id: number;
//   name: string;
//   overview: string;
//   poster_path: string | null;
//   season_number: number;
//   vote_average: number;
// }

// export interface Creator {
//   id: number;
//   credit_id: string;
//   name: string;
//   original_name: string;
//   gender: number;
//   profile_path: string | null;
// }

// export interface EpisodeInfo {
//   id: number;
//   name: string;
//   overview: string;
//   vote_average: number;
//   vote_count: number;
//   air_date: string;
//   episode_number: number;
//   episode_type: string;
//   production_code: string;
//   runtime: number;
//   season_number: number;
//   show_id: number;
//   still_path: string | null;
// }


// export interface ShowDetails {
//   adult: boolean;
//   backdrop_path: string | null;
//   created_by: Creator[];
//   episode_run_time: number[];
//   first_air_date: string;
//   genres: Genre[];
//   homepage: string;
//   id: number;
//   in_production: boolean;
//   languages: string[];
//   last_air_date: string;
//   last_episode_to_air: EpisodeInfo | null;
//   name: string;
//   next_episode_to_air: EpisodeInfo | null;
//   networks: Network[];
//   number_of_episodes: number;
//   number_of_seasons: number;
//   origin_country: string[];
//   original_language: string;
//   original_name: string;
//   overview: string;
//   popularity: number;
//   poster_path: string | null;
//   production_companies: ProductionCompany[];
//   production_countries: ProductionCountry[];
//   seasons: SeasonSummary[];
//   spoken_languages: SpokenLanguage[];
//   status: string;
//   tagline: string;
//   type: string;
//   vote_average: number;
//   vote_count: number;

//   bgColor?: string; // optional show background color
// }
