-- CreateTable
CREATE TABLE "F4101" (
    "itm" SERIAL NOT NULL,
    "litm" TEXT,
    "dsc1" TEXT NOT NULL,
    "dsc2" TEXT,
    "srtx" TEXT,
    "stkt" TEXT NOT NULL,
    "glpt" TEXT,
    "uom1" TEXT,
    "lnty" TEXT DEFAULT 'S',
    "bpfg" TEXT DEFAULT 'P',
    "plnr" TEXT,
    "buyr" TEXT,
    "bkor" BOOLEAN NOT NULL DEFAULT true,
    "chkav" BOOLEAN NOT NULL DEFAULT true,
    "cmcg" INTEGER DEFAULT 2,
    "sals" INTEGER DEFAULT 2,
    "purl" INTEGER DEFAULT 3,
    "kitp" TEXT,
    "cfgc" TEXT,
    "cmmt" INTEGER DEFAULT 1,
    "prtm" TEXT,
    "flsh" TEXT,
    "uomc" TEXT,

    CONSTRAINT "F4101_pkey" PRIMARY KEY ("itm")
);
