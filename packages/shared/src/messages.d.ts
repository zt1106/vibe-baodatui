import { z } from 'zod';
export declare const DomainContractVersion: "2024-12-01";
export declare const TableId: z.ZodString;
export type TableId = z.infer<typeof TableId>;
export declare const SeatId: z.ZodString;
export type SeatId = z.infer<typeof SeatId>;
export declare const UserId: z.ZodNumber;
export type UserId = z.infer<typeof UserId>;
export declare const GameVariantId: z.ZodEnum<["classic", "dou-dizhu"]>;
export type GameVariantId = z.infer<typeof GameVariantId>;
export declare const GameVariantCapacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    min: z.ZodNumber;
    max: z.ZodNumber;
    locked: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    min: number;
    max: number;
    locked?: number | undefined;
}, {
    min: number;
    max: number;
    locked?: number | undefined;
}>, {
    min: number;
    max: number;
    locked?: number | undefined;
}, {
    min: number;
    max: number;
    locked?: number | undefined;
}>, {
    min: number;
    max: number;
    locked?: number | undefined;
}, {
    min: number;
    max: number;
    locked?: number | undefined;
}>;
export type GameVariantCapacity = z.infer<typeof GameVariantCapacity>;
export declare const GameVariantSummary: z.ZodObject<{
    id: z.ZodEnum<["classic", "dou-dizhu"]>;
    name: z.ZodString;
    description: z.ZodString;
    capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        locked: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
        locked?: number | undefined;
    }, {
        min: number;
        max: number;
        locked?: number | undefined;
    }>, {
        min: number;
        max: number;
        locked?: number | undefined;
    }, {
        min: number;
        max: number;
        locked?: number | undefined;
    }>, {
        min: number;
        max: number;
        locked?: number | undefined;
    }, {
        min: number;
        max: number;
        locked?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: "classic" | "dou-dizhu";
    name: string;
    description: string;
    capacity: {
        min: number;
        max: number;
        locked?: number | undefined;
    };
}, {
    id: "classic" | "dou-dizhu";
    name: string;
    description: string;
    capacity: {
        min: number;
        max: number;
        locked?: number | undefined;
    };
}>;
export type GameVariantSummary = z.infer<typeof GameVariantSummary>;
export declare const PlayerIdentity: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}>;
export type PlayerIdentity = z.infer<typeof PlayerIdentity>;
export declare const LobbyRoomStatus: z.ZodEnum<["waiting", "in-progress", "full"]>;
export type LobbyRoomStatus = z.infer<typeof LobbyRoomStatus>;
export declare const LobbyRoom: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["waiting", "in-progress", "full"]>;
    players: z.ZodNumber;
    capacity: z.ZodNumber;
    variant: z.ZodObject<{
        id: z.ZodEnum<["classic", "dou-dizhu"]>;
        name: z.ZodString;
        description: z.ZodString;
        capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            locked: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    status: "waiting" | "in-progress" | "full";
    id: string;
    capacity: number;
    players: number;
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
}, {
    status: "waiting" | "in-progress" | "full";
    id: string;
    capacity: number;
    players: number;
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
}>;
export type LobbyRoom = z.infer<typeof LobbyRoom>;
export declare const LobbyNotification: z.ZodObject<{
    id: z.ZodString;
    message: z.ZodString;
    tone: z.ZodEnum<["info", "warning"]>;
}, "strip", z.ZodTypeAny, {
    message: string;
    id: string;
    tone: "info" | "warning";
}, {
    message: string;
    id: string;
    tone: "info" | "warning";
}>;
export type LobbyNotification = z.infer<typeof LobbyNotification>;
export declare const LobbyRoomsResponse: z.ZodObject<{
    rooms: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["waiting", "in-progress", "full"]>;
        players: z.ZodNumber;
        capacity: z.ZodNumber;
        variant: z.ZodObject<{
            id: z.ZodEnum<["classic", "dou-dizhu"]>;
            name: z.ZodString;
            description: z.ZodString;
            capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
                locked: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        status: "waiting" | "in-progress" | "full";
        id: string;
        capacity: number;
        players: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }, {
        status: "waiting" | "in-progress" | "full";
        id: string;
        capacity: number;
        players: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }>, "many">;
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        message: z.ZodString;
        tone: z.ZodEnum<["info", "warning"]>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        id: string;
        tone: "info" | "warning";
    }, {
        message: string;
        id: string;
        tone: "info" | "warning";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    rooms: {
        status: "waiting" | "in-progress" | "full";
        id: string;
        capacity: number;
        players: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }[];
    notifications: {
        message: string;
        id: string;
        tone: "info" | "warning";
    }[];
}, {
    rooms: {
        status: "waiting" | "in-progress" | "full";
        id: string;
        capacity: number;
        players: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }[];
    notifications: {
        message: string;
        id: string;
        tone: "info" | "warning";
    }[];
}>;
export type LobbyRoomsResponse = z.infer<typeof LobbyRoomsResponse>;
export declare const TablePlayer: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
} & {
    prepared: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    prepared: boolean;
}, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    prepared: boolean;
}>;
export type TablePlayer = z.infer<typeof TablePlayer>;
export declare const TableHost: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}>;
export type TableHost = z.infer<typeof TableHost>;
export declare const TableSeatState: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
} & {
    seatId: z.ZodString;
    prepared: z.ZodBoolean;
    handCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    prepared: boolean;
    seatId: string;
    handCount?: number | undefined;
}, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    prepared: boolean;
    seatId: string;
    handCount?: number | undefined;
}>;
export type TableSeatState = z.infer<typeof TableSeatState>;
export declare const TableConfig: z.ZodObject<{
    capacity: z.ZodNumber;
    variant: z.ZodObject<{
        id: z.ZodEnum<["classic", "dou-dizhu"]>;
        name: z.ZodString;
        description: z.ZodString;
        capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            locked: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    capacity: number;
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
}, {
    capacity: number;
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
}>;
export type TableConfig = z.infer<typeof TableConfig>;
export declare const TablePrepareResponse: z.ZodObject<{
    tableId: z.ZodString;
    status: z.ZodEnum<["waiting", "in-progress", "full"]>;
    host: z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
    players: z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    } & {
        prepared: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
    }>, "many">;
    config: z.ZodObject<{
        capacity: z.ZodNumber;
        variant: z.ZodObject<{
            id: z.ZodEnum<["classic", "dou-dizhu"]>;
            name: z.ZodString;
            description: z.ZodString;
            capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
                locked: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }, {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }>;
}, "strip", z.ZodTypeAny, {
    status: "waiting" | "in-progress" | "full";
    players: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
    }[];
    tableId: string;
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    config: {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    };
}, {
    status: "waiting" | "in-progress" | "full";
    players: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
    }[];
    tableId: string;
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    config: {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    };
}>;
export type TablePrepareResponse = z.infer<typeof TablePrepareResponse>;
export declare const UserPayload: z.ZodObject<{
    id: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
}, "strip", z.ZodTypeAny, {
    id: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}, {
    id: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}>;
export type UserPayload = z.infer<typeof UserPayload>;
export declare const RegisterUserRequest: z.ZodObject<{
    nickname: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nickname: string;
}, {
    nickname: string;
}>;
export type RegisterUserRequest = z.infer<typeof RegisterUserRequest>;
export declare const RegisterUserResponse: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}>;
export type RegisterUserResponse = z.infer<typeof RegisterUserResponse>;
export declare const UpdateAvatarRequest: z.ZodObject<{
    userId: z.ZodNumber;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}, {
    userId: number;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
}>;
export type UpdateAvatarRequest = z.infer<typeof UpdateAvatarRequest>;
export declare const UpdateAvatarResponse: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}>;
export type UpdateAvatarResponse = z.infer<typeof UpdateAvatarResponse>;
export declare const UpdateNicknameRequest: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
}, {
    userId: number;
    nickname: string;
}>;
export type UpdateNicknameRequest = z.infer<typeof UpdateNicknameRequest>;
export declare const UpdateNicknameResponse: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}>;
export type UpdateNicknameResponse = z.infer<typeof UpdateNicknameResponse>;
export declare const LoginUserRequest: z.ZodObject<{
    nickname: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nickname: string;
}, {
    nickname: string;
}>;
export type LoginUserRequest = z.infer<typeof LoginUserRequest>;
export declare const LoginUserResponse: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}, {
    user: {
        id: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
}>;
export type LoginUserResponse = z.infer<typeof LoginUserResponse>;
export declare const JoinTable: z.ZodObject<{
    tableId: z.ZodString;
    nickname: z.ZodString;
    userId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    nickname: string;
    tableId: string;
    userId?: number | undefined;
}, {
    nickname: string;
    tableId: string;
    userId?: number | undefined;
}>;
export type JoinTable = z.infer<typeof JoinTable>;
export declare const CreateTableRequest: z.ZodObject<{
    host: z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
    variantId: z.ZodEnum<["classic", "dou-dizhu"]>;
}, "strip", z.ZodTypeAny, {
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    variantId: "classic" | "dou-dizhu";
}, {
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    variantId: "classic" | "dou-dizhu";
}>;
export type CreateTableRequest = z.infer<typeof CreateTableRequest>;
export declare const TableStartRequest: z.ZodObject<{
    tableId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tableId: string;
}, {
    tableId: string;
}>;
export type TableStartRequest = z.infer<typeof TableStartRequest>;
export declare const TableKickRequest: z.ZodObject<{
    tableId: z.ZodString;
    userId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userId: number;
    tableId: string;
}, {
    userId: number;
    tableId: string;
}>;
export type TableKickRequest = z.infer<typeof TableKickRequest>;
export declare const TableConfigUpdateRequest: z.ZodObject<{
    tableId: z.ZodString;
    capacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    capacity: number;
    tableId: string;
}, {
    capacity: number;
    tableId: string;
}>;
export type TableConfigUpdateRequest = z.infer<typeof TableConfigUpdateRequest>;
export declare const ServerState: z.ZodObject<{
    tableId: z.ZodString;
    status: z.ZodEnum<["waiting", "in-progress", "full"]>;
    host: z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    }>;
    config: z.ZodObject<{
        capacity: z.ZodNumber;
        variant: z.ZodObject<{
            id: z.ZodEnum<["classic", "dou-dizhu"]>;
            name: z.ZodString;
            description: z.ZodString;
            capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
                locked: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }, {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    }>;
    seats: z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    } & {
        seatId: z.ZodString;
        prepared: z.ZodBoolean;
        handCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
        seatId: string;
        handCount?: number | undefined;
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
        seatId: string;
        handCount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "waiting" | "in-progress" | "full";
    tableId: string;
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    config: {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    };
    seats: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
        seatId: string;
        handCount?: number | undefined;
    }[];
}, {
    status: "waiting" | "in-progress" | "full";
    tableId: string;
    host: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    };
    config: {
        capacity: number;
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
    };
    seats: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        prepared: boolean;
        seatId: string;
        handCount?: number | undefined;
    }[];
}>;
export type ServerState = z.infer<typeof ServerState>;
export declare const TablePreparedRequest: z.ZodObject<{
    tableId: z.ZodString;
    prepared: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    prepared: boolean;
    tableId: string;
}, {
    prepared: boolean;
    tableId: string;
}>;
export type TablePreparedRequest = z.infer<typeof TablePreparedRequest>;
export declare const GameCard: z.ZodObject<{
    id: z.ZodNumber;
    rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
    suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
    faceUp: z.ZodBoolean;
    meta: z.ZodOptional<z.ZodObject<{
        ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        ownerSeat?: number | undefined;
        selectable?: boolean | undefined;
        tags?: string[] | undefined;
    }, {
        ownerSeat?: number | undefined;
        selectable?: boolean | undefined;
        tags?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: number;
    rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
    suit: "S" | "H" | "D" | "C" | "JB" | "JR";
    faceUp: boolean;
    meta?: {
        ownerSeat?: number | undefined;
        selectable?: boolean | undefined;
        tags?: string[] | undefined;
    } | undefined;
}, {
    id: number;
    rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
    suit: "S" | "H" | "D" | "C" | "JB" | "JR";
    faceUp: boolean;
    meta?: {
        ownerSeat?: number | undefined;
        selectable?: boolean | undefined;
        tags?: string[] | undefined;
    } | undefined;
}>;
export type GameCard = z.infer<typeof GameCard>;
export declare const GamePhase: z.ZodEnum<["idle", "dealing", "complete"]>;
export type GamePhase = z.infer<typeof GamePhase>;
export declare const GameSeatState: z.ZodObject<{
    userId: z.ZodNumber;
    nickname: z.ZodString;
    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
} & {
    seatId: z.ZodString;
    handCount: z.ZodNumber;
    isHost: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    seatId: string;
    handCount: number;
    isHost: boolean;
}, {
    userId: number;
    nickname: string;
    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
    seatId: string;
    handCount: number;
    isHost: boolean;
}>;
export type GameSeatState = z.infer<typeof GameSeatState>;
export declare const GameSnapshot: z.ZodObject<{
    tableId: z.ZodString;
    phase: z.ZodEnum<["idle", "dealing", "complete"]>;
    deckCount: z.ZodNumber;
    lastDealtSeatId: z.ZodOptional<z.ZodString>;
    variant: z.ZodObject<{
        id: z.ZodEnum<["classic", "dou-dizhu"]>;
        name: z.ZodString;
        description: z.ZodString;
        capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            locked: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }, {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    }>;
    seats: z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        nickname: z.ZodString;
        avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
    } & {
        seatId: z.ZodString;
        handCount: z.ZodNumber;
        isHost: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        seatId: string;
        handCount: number;
        isHost: boolean;
    }, {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        seatId: string;
        handCount: number;
        isHost: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
    tableId: string;
    seats: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        seatId: string;
        handCount: number;
        isHost: boolean;
    }[];
    phase: "idle" | "dealing" | "complete";
    deckCount: number;
    lastDealtSeatId?: string | undefined;
}, {
    variant: {
        id: "classic" | "dou-dizhu";
        name: string;
        description: string;
        capacity: {
            min: number;
            max: number;
            locked?: number | undefined;
        };
    };
    tableId: string;
    seats: {
        userId: number;
        nickname: string;
        avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        seatId: string;
        handCount: number;
        isHost: boolean;
    }[];
    phase: "idle" | "dealing" | "complete";
    deckCount: number;
    lastDealtSeatId?: string | undefined;
}>;
export type GameSnapshot = z.infer<typeof GameSnapshot>;
export declare const GameDealCardEvent: z.ZodObject<{
    tableId: z.ZodString;
    seatId: z.ZodString;
    card: z.ZodObject<{
        id: z.ZodNumber;
        rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
        suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
        faceUp: z.ZodBoolean;
        meta: z.ZodOptional<z.ZodObject<{
            ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
            selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
            tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        }, "strip", z.ZodTypeAny, {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        }, {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }, {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    seatId: string;
    tableId: string;
    card: {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    };
}, {
    seatId: string;
    tableId: string;
    card: {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    };
}>;
export type GameDealCardEvent = z.infer<typeof GameDealCardEvent>;
export declare const TablePlayStateResponse: z.ZodObject<{
    snapshot: z.ZodObject<{
        tableId: z.ZodString;
        phase: z.ZodEnum<["idle", "dealing", "complete"]>;
        deckCount: z.ZodNumber;
        lastDealtSeatId: z.ZodOptional<z.ZodString>;
        variant: z.ZodObject<{
            id: z.ZodEnum<["classic", "dou-dizhu"]>;
            name: z.ZodString;
            description: z.ZodString;
            capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
                locked: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }>;
        seats: z.ZodArray<z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        } & {
            seatId: z.ZodString;
            handCount: z.ZodNumber;
            isHost: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
        tableId: string;
        seats: {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }[];
        phase: "idle" | "dealing" | "complete";
        deckCount: number;
        lastDealtSeatId?: string | undefined;
    }, {
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
        tableId: string;
        seats: {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }[];
        phase: "idle" | "dealing" | "complete";
        deckCount: number;
        lastDealtSeatId?: string | undefined;
    }>;
    hand: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
        suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
        faceUp: z.ZodBoolean;
        meta: z.ZodOptional<z.ZodObject<{
            ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
            selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
            tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        }, "strip", z.ZodTypeAny, {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        }, {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }, {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    snapshot: {
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
        tableId: string;
        seats: {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }[];
        phase: "idle" | "dealing" | "complete";
        deckCount: number;
        lastDealtSeatId?: string | undefined;
    };
    hand: {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }[];
}, {
    snapshot: {
        variant: {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        };
        tableId: string;
        seats: {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }[];
        phase: "idle" | "dealing" | "complete";
        deckCount: number;
        lastDealtSeatId?: string | undefined;
    };
    hand: {
        id: number;
        rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
        suit: "S" | "H" | "D" | "C" | "JB" | "JR";
        faceUp: boolean;
        meta?: {
            ownerSeat?: number | undefined;
            selectable?: boolean | undefined;
            tags?: string[] | undefined;
        } | undefined;
    }[];
}>;
export type TablePlayStateResponse = z.infer<typeof TablePlayStateResponse>;
export declare const DomainContracts: {
    readonly version: "2024-12-01";
    readonly scalars: {
        readonly TableId: z.ZodString;
        readonly SeatId: z.ZodString;
        readonly UserId: z.ZodNumber;
    };
    readonly variants: {
        readonly GameVariantId: z.ZodEnum<["classic", "dou-dizhu"]>;
        readonly GameVariantCapacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            locked: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>, {
            min: number;
            max: number;
            locked?: number | undefined;
        }, {
            min: number;
            max: number;
            locked?: number | undefined;
        }>;
        readonly GameVariantSummary: z.ZodObject<{
            id: z.ZodEnum<["classic", "dou-dizhu"]>;
            name: z.ZodString;
            description: z.ZodString;
            capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
                locked: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>, {
                min: number;
                max: number;
                locked?: number | undefined;
            }, {
                min: number;
                max: number;
                locked?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }, {
            id: "classic" | "dou-dizhu";
            name: string;
            description: string;
            capacity: {
                min: number;
                max: number;
                locked?: number | undefined;
            };
        }>;
    };
    readonly lobby: {
        readonly LobbyRoomStatus: z.ZodEnum<["waiting", "in-progress", "full"]>;
        readonly LobbyRoom: z.ZodObject<{
            id: z.ZodString;
            status: z.ZodEnum<["waiting", "in-progress", "full"]>;
            players: z.ZodNumber;
            capacity: z.ZodNumber;
            variant: z.ZodObject<{
                id: z.ZodEnum<["classic", "dou-dizhu"]>;
                name: z.ZodString;
                description: z.ZodString;
                capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                    locked: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }>;
        }, "strip", z.ZodTypeAny, {
            status: "waiting" | "in-progress" | "full";
            id: string;
            capacity: number;
            players: number;
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
        }, {
            status: "waiting" | "in-progress" | "full";
            id: string;
            capacity: number;
            players: number;
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
        }>;
        readonly LobbyNotification: z.ZodObject<{
            id: z.ZodString;
            message: z.ZodString;
            tone: z.ZodEnum<["info", "warning"]>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            id: string;
            tone: "info" | "warning";
        }, {
            message: string;
            id: string;
            tone: "info" | "warning";
        }>;
        readonly LobbyRoomsResponse: z.ZodObject<{
            rooms: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                status: z.ZodEnum<["waiting", "in-progress", "full"]>;
                players: z.ZodNumber;
                capacity: z.ZodNumber;
                variant: z.ZodObject<{
                    id: z.ZodEnum<["classic", "dou-dizhu"]>;
                    name: z.ZodString;
                    description: z.ZodString;
                    capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                        min: z.ZodNumber;
                        max: z.ZodNumber;
                        locked: z.ZodOptional<z.ZodNumber>;
                    }, "strip", z.ZodTypeAny, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }>;
            }, "strip", z.ZodTypeAny, {
                status: "waiting" | "in-progress" | "full";
                id: string;
                capacity: number;
                players: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }, {
                status: "waiting" | "in-progress" | "full";
                id: string;
                capacity: number;
                players: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }>, "many">;
            notifications: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                message: z.ZodString;
                tone: z.ZodEnum<["info", "warning"]>;
            }, "strip", z.ZodTypeAny, {
                message: string;
                id: string;
                tone: "info" | "warning";
            }, {
                message: string;
                id: string;
                tone: "info" | "warning";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            rooms: {
                status: "waiting" | "in-progress" | "full";
                id: string;
                capacity: number;
                players: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }[];
            notifications: {
                message: string;
                id: string;
                tone: "info" | "warning";
            }[];
        }, {
            rooms: {
                status: "waiting" | "in-progress" | "full";
                id: string;
                capacity: number;
                players: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }[];
            notifications: {
                message: string;
                id: string;
                tone: "info" | "warning";
            }[];
        }>;
    };
    readonly auth: {
        readonly UserPayload: z.ZodObject<{
            id: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }, {
            id: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }>;
        readonly RegisterUserRequest: z.ZodObject<{
            nickname: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            nickname: string;
        }, {
            nickname: string;
        }>;
        readonly RegisterUserResponse: z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }>;
        readonly LoginUserRequest: z.ZodObject<{
            nickname: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            nickname: string;
        }, {
            nickname: string;
        }>;
        readonly LoginUserResponse: z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }>;
        readonly UpdateAvatarRequest: z.ZodObject<{
            userId: z.ZodNumber;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }, {
            userId: number;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }>;
        readonly UpdateAvatarResponse: z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }>;
        readonly UpdateNicknameRequest: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
        }, {
            userId: number;
            nickname: string;
        }>;
        readonly UpdateNicknameResponse: z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }, {
            user: {
                id: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
        }>;
    };
    readonly table: {
        readonly PlayerIdentity: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }>;
        readonly TablePlayer: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        } & {
            prepared: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            prepared: boolean;
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            prepared: boolean;
        }>;
        readonly TableSeatState: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        } & {
            seatId: z.ZodString;
            prepared: z.ZodBoolean;
            handCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            prepared: boolean;
            seatId: string;
            handCount?: number | undefined;
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            prepared: boolean;
            seatId: string;
            handCount?: number | undefined;
        }>;
        readonly TableHost: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
        }>;
        readonly TableConfig: z.ZodObject<{
            capacity: z.ZodNumber;
            variant: z.ZodObject<{
                id: z.ZodEnum<["classic", "dou-dizhu"]>;
                name: z.ZodString;
                description: z.ZodString;
                capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                    locked: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }>;
        }, "strip", z.ZodTypeAny, {
            capacity: number;
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
        }, {
            capacity: number;
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
        }>;
        readonly TablePrepareResponse: z.ZodObject<{
            tableId: z.ZodString;
            status: z.ZodEnum<["waiting", "in-progress", "full"]>;
            host: z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
            players: z.ZodArray<z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            } & {
                prepared: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
            }>, "many">;
            config: z.ZodObject<{
                capacity: z.ZodNumber;
                variant: z.ZodObject<{
                    id: z.ZodEnum<["classic", "dou-dizhu"]>;
                    name: z.ZodString;
                    description: z.ZodString;
                    capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                        min: z.ZodNumber;
                        max: z.ZodNumber;
                        locked: z.ZodOptional<z.ZodNumber>;
                    }, "strip", z.ZodTypeAny, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }>;
            }, "strip", z.ZodTypeAny, {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }, {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }>;
        }, "strip", z.ZodTypeAny, {
            status: "waiting" | "in-progress" | "full";
            players: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
            }[];
            tableId: string;
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            config: {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            };
        }, {
            status: "waiting" | "in-progress" | "full";
            players: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
            }[];
            tableId: string;
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            config: {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            };
        }>;
        readonly TableConfigUpdateRequest: z.ZodObject<{
            tableId: z.ZodString;
            capacity: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            capacity: number;
            tableId: string;
        }, {
            capacity: number;
            tableId: string;
        }>;
        readonly TableKickRequest: z.ZodObject<{
            tableId: z.ZodString;
            userId: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            tableId: string;
        }, {
            userId: number;
            tableId: string;
        }>;
        readonly TablePreparedRequest: z.ZodObject<{
            tableId: z.ZodString;
            prepared: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            prepared: boolean;
            tableId: string;
        }, {
            prepared: boolean;
            tableId: string;
        }>;
        readonly TableStartRequest: z.ZodObject<{
            tableId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tableId: string;
        }, {
            tableId: string;
        }>;
        readonly CreateTableRequest: z.ZodObject<{
            host: z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
            variantId: z.ZodEnum<["classic", "dou-dizhu"]>;
        }, "strip", z.ZodTypeAny, {
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            variantId: "classic" | "dou-dizhu";
        }, {
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            variantId: "classic" | "dou-dizhu";
        }>;
        readonly JoinTable: z.ZodObject<{
            tableId: z.ZodString;
            nickname: z.ZodString;
            userId: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            nickname: string;
            tableId: string;
            userId?: number | undefined;
        }, {
            nickname: string;
            tableId: string;
            userId?: number | undefined;
        }>;
        readonly ServerState: z.ZodObject<{
            tableId: z.ZodString;
            status: z.ZodEnum<["waiting", "in-progress", "full"]>;
            host: z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            }>;
            config: z.ZodObject<{
                capacity: z.ZodNumber;
                variant: z.ZodObject<{
                    id: z.ZodEnum<["classic", "dou-dizhu"]>;
                    name: z.ZodString;
                    description: z.ZodString;
                    capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                        min: z.ZodNumber;
                        max: z.ZodNumber;
                        locked: z.ZodOptional<z.ZodNumber>;
                    }, "strip", z.ZodTypeAny, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }>;
            }, "strip", z.ZodTypeAny, {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }, {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            }>;
            seats: z.ZodArray<z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            } & {
                seatId: z.ZodString;
                prepared: z.ZodBoolean;
                handCount: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
                seatId: string;
                handCount?: number | undefined;
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
                seatId: string;
                handCount?: number | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            status: "waiting" | "in-progress" | "full";
            tableId: string;
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            config: {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            };
            seats: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
                seatId: string;
                handCount?: number | undefined;
            }[];
        }, {
            status: "waiting" | "in-progress" | "full";
            tableId: string;
            host: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            };
            config: {
                capacity: number;
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
            };
            seats: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                prepared: boolean;
                seatId: string;
                handCount?: number | undefined;
            }[];
        }>;
    };
    readonly game: {
        readonly CardSuit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
        readonly CardRank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
        readonly GameCard: z.ZodObject<{
            id: z.ZodNumber;
            rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
            suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
            faceUp: z.ZodBoolean;
            meta: z.ZodOptional<z.ZodObject<{
                ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
                selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
                tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
            }, "strip", z.ZodTypeAny, {
                ownerSeat?: number | undefined;
                selectable?: boolean | undefined;
                tags?: string[] | undefined;
            }, {
                ownerSeat?: number | undefined;
                selectable?: boolean | undefined;
                tags?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
            suit: "S" | "H" | "D" | "C" | "JB" | "JR";
            faceUp: boolean;
            meta?: {
                ownerSeat?: number | undefined;
                selectable?: boolean | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }, {
            id: number;
            rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
            suit: "S" | "H" | "D" | "C" | "JB" | "JR";
            faceUp: boolean;
            meta?: {
                ownerSeat?: number | undefined;
                selectable?: boolean | undefined;
                tags?: string[] | undefined;
            } | undefined;
        }>;
        readonly GamePhase: z.ZodEnum<["idle", "dealing", "complete"]>;
        readonly GameSeatState: z.ZodObject<{
            userId: z.ZodNumber;
            nickname: z.ZodString;
            avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
        } & {
            seatId: z.ZodString;
            handCount: z.ZodNumber;
            isHost: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }, {
            userId: number;
            nickname: string;
            avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
            seatId: string;
            handCount: number;
            isHost: boolean;
        }>;
        readonly GameSnapshot: z.ZodObject<{
            tableId: z.ZodString;
            phase: z.ZodEnum<["idle", "dealing", "complete"]>;
            deckCount: z.ZodNumber;
            lastDealtSeatId: z.ZodOptional<z.ZodString>;
            variant: z.ZodObject<{
                id: z.ZodEnum<["classic", "dou-dizhu"]>;
                name: z.ZodString;
                description: z.ZodString;
                capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                    min: z.ZodNumber;
                    max: z.ZodNumber;
                    locked: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }, {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }, {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            }>;
            seats: z.ZodArray<z.ZodObject<{
                userId: z.ZodNumber;
                nickname: z.ZodString;
                avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
            } & {
                seatId: z.ZodString;
                handCount: z.ZodNumber;
                isHost: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                seatId: string;
                handCount: number;
                isHost: boolean;
            }, {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                seatId: string;
                handCount: number;
                isHost: boolean;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
            tableId: string;
            seats: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                seatId: string;
                handCount: number;
                isHost: boolean;
            }[];
            phase: "idle" | "dealing" | "complete";
            deckCount: number;
            lastDealtSeatId?: string | undefined;
        }, {
            variant: {
                id: "classic" | "dou-dizhu";
                name: string;
                description: string;
                capacity: {
                    min: number;
                    max: number;
                    locked?: number | undefined;
                };
            };
            tableId: string;
            seats: {
                userId: number;
                nickname: string;
                avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                seatId: string;
                handCount: number;
                isHost: boolean;
            }[];
            phase: "idle" | "dealing" | "complete";
            deckCount: number;
            lastDealtSeatId?: string | undefined;
        }>;
        readonly GameDealCardEvent: z.ZodObject<{
            tableId: z.ZodString;
            seatId: z.ZodString;
            card: z.ZodObject<{
                id: z.ZodNumber;
                rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
                suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
                faceUp: z.ZodBoolean;
                meta: z.ZodOptional<z.ZodObject<{
                    ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
                    selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
                    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
                }, "strip", z.ZodTypeAny, {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                }, {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }, {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            seatId: string;
            tableId: string;
            card: {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            };
        }, {
            seatId: string;
            tableId: string;
            card: {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            };
        }>;
        readonly TablePlayStateResponse: z.ZodObject<{
            snapshot: z.ZodObject<{
                tableId: z.ZodString;
                phase: z.ZodEnum<["idle", "dealing", "complete"]>;
                deckCount: z.ZodNumber;
                lastDealtSeatId: z.ZodOptional<z.ZodString>;
                variant: z.ZodObject<{
                    id: z.ZodEnum<["classic", "dou-dizhu"]>;
                    name: z.ZodString;
                    description: z.ZodString;
                    capacity: z.ZodEffects<z.ZodEffects<z.ZodObject<{
                        min: z.ZodNumber;
                        max: z.ZodNumber;
                        locked: z.ZodOptional<z.ZodNumber>;
                    }, "strip", z.ZodTypeAny, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }, {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    }>;
                }, "strip", z.ZodTypeAny, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }, {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                }>;
                seats: z.ZodArray<z.ZodObject<{
                    userId: z.ZodNumber;
                    nickname: z.ZodString;
                    avatar: z.ZodEnum<["1F332.png", "1F333.png", "1F334.png", "1F335.png", "1F337.png", "1F338.png", "1F339.png", "1F33A.png", "1F33B.png", "1F3D4.png", "1F42D.png", "1F42E.png", "1F42F.png", "1F430.png", "1F431.png", "1F435.png", "1F436.png", "1F43B.png", "1F43C.png", "1F981.png", "3d_1.png", "3d_4.png", "bluey_4.png", "memo_12.png", "notion_7.png", "vibrent_1.png", "vibrent_2.png", "vibrent_3.png", "vibrent_6.png"]>;
                } & {
                    seatId: z.ZodString;
                    handCount: z.ZodNumber;
                    isHost: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }, {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
                tableId: string;
                seats: {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }[];
                phase: "idle" | "dealing" | "complete";
                deckCount: number;
                lastDealtSeatId?: string | undefined;
            }, {
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
                tableId: string;
                seats: {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }[];
                phase: "idle" | "dealing" | "complete";
                deckCount: number;
                lastDealtSeatId?: string | undefined;
            }>;
            hand: z.ZodArray<z.ZodObject<{
                id: z.ZodNumber;
                rank: z.ZodEnum<["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "Joker"]>;
                suit: z.ZodEnum<["S", "H", "D", "C", "JB", "JR"]>;
                faceUp: z.ZodBoolean;
                meta: z.ZodOptional<z.ZodObject<{
                    ownerSeat: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
                    selectable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
                    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
                }, "strip", z.ZodTypeAny, {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                }, {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }, {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            snapshot: {
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
                tableId: string;
                seats: {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }[];
                phase: "idle" | "dealing" | "complete";
                deckCount: number;
                lastDealtSeatId?: string | undefined;
            };
            hand: {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[];
        }, {
            snapshot: {
                variant: {
                    id: "classic" | "dou-dizhu";
                    name: string;
                    description: string;
                    capacity: {
                        min: number;
                        max: number;
                        locked?: number | undefined;
                    };
                };
                tableId: string;
                seats: {
                    userId: number;
                    nickname: string;
                    avatar: "1F332.png" | "1F333.png" | "1F334.png" | "1F335.png" | "1F337.png" | "1F338.png" | "1F339.png" | "1F33A.png" | "1F33B.png" | "1F3D4.png" | "1F42D.png" | "1F42E.png" | "1F42F.png" | "1F430.png" | "1F431.png" | "1F435.png" | "1F436.png" | "1F43B.png" | "1F43C.png" | "1F981.png" | "3d_1.png" | "3d_4.png" | "bluey_4.png" | "memo_12.png" | "notion_7.png" | "vibrent_1.png" | "vibrent_2.png" | "vibrent_3.png" | "vibrent_6.png";
                    seatId: string;
                    handCount: number;
                    isHost: boolean;
                }[];
                phase: "idle" | "dealing" | "complete";
                deckCount: number;
                lastDealtSeatId?: string | undefined;
            };
            hand: {
                id: number;
                rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" | "J" | "Q" | "K" | "Joker";
                suit: "S" | "H" | "D" | "C" | "JB" | "JR";
                faceUp: boolean;
                meta?: {
                    ownerSeat?: number | undefined;
                    selectable?: boolean | undefined;
                    tags?: string[] | undefined;
                } | undefined;
            }[];
        }>;
    };
};
export type DomainContracts = typeof DomainContracts;
